import {IHttpResponse, ITimer} from './utils/types';
import {IMseAdapter} from './mse-adapter';
import {
  IRepresentation,
  ISegment,
  MediaType,
  IPresentation,
} from './dash/types';
import {Timer} from './utils/timer';
import {HttpRequest, NetworkHandle} from './utils/network';

interface MediaState {
  type: MediaType;
  stream: IRepresentation;
  needInit: boolean;
  lastSegment: ISegment | null;
  updating: boolean;
  scheduleTimer: ITimer | null;
}

/**
 * The Streamer
 *
 * This class is responsible for streaming the media content by leveraging
 * the MSE APIs (via the MSE Adapter).
 */
export class Streamer {
  private mse_: IMseAdapter;
  private presentation_: IPresentation;
  private mediaStates_: Map<MediaType, MediaState> = new Map();
  private startTime_: number | null = null;
  private stopped_ = false;
  private readonly scheduleInterval: number = 0.25;

  constructor(mseAdapter: IMseAdapter, presentation: IPresentation) {
    this.mse_ = mseAdapter;
    this.presentation_ = presentation;
  }

  /**
   * This method sets up the streamer. It needs to be called first!
   * Upon call, it will open the media source and setup source buffers for
   * streams in |streamMap|. Futhermore it will create an internal media state
   * for each stream in |streamMap|; the media state keeps record of the
   * stream's context the streamer needs to operate correctly.
   *
   * @param streamMap A map containing initial streams
   * @returns Promise
   */
  async setup(streamMap: Map<MediaType, IRepresentation>): Promise<void> {
    await this.mse_.openMediaSource();
    await this.mse_.setupSourceBuffers(streamMap);

    // Create media states
    streamMap.forEach((stream, mediatType) => {
      if (mediatType === MediaType.VIDEO) {
        if (!this.mediaStates_.has(mediatType)) {
          this.mediaStates_.set(
            mediatType,
            this.createMediaState_(mediatType, stream)
          );
        }
      }

      if (mediatType === MediaType.AUDIO) {
        if (!this.mediaStates_.has(mediatType)) {
          this.mediaStates_.set(
            mediatType,
            this.createMediaState_(mediatType, stream)
          );
        }
      }
    });

    // This operation is successful is we could setup all streams.
    console.assert(
      streamMap.size === this.mediaStates_.size,
      'Should have media states for all types'
    );

    // Set duration
    const stream =
      streamMap.get(MediaType.VIDEO) || streamMap.get(MediaType.AUDIO);

    // TODO - Add getDuration() to IPresentation
    let duration = stream?.segmentIndex.getEndTime();

    if (!duration) {
      throw new Error('Could not set stream duration!');
    }

    if (this.presentation_.isLive()) {
      duration = Number.MAX_SAFE_INTEGER;
    }

    this.mse_.setDuration(duration);
  }

  /**
   * Start the streaming. At this point the media source and source buffers
   * are set. This method will set the stream start time and active
   * the schedule timer for each media state.
   *
   * @returns True if successful, false otherwise.
   */
  start(): boolean {
    if (this.mediaStates_.size === 0) {
      console.warn('Streams needs to be setup before start. No-op...');
      return false;
    }

    if (this.startTime_) {
      console.warn('Streaming already started...');
      return false;
    }

    this.stopped_ = false;
    this.startTime_ = 0;

    // For live stream calculate 'tune-in' time.
    if (this.presentation_.isLive()) {
      const presentationDelay = this.presentation_.getDelay();
      this.startTime_ = Math.max(0, this.getLiveEdge_() - presentationDelay);
    }

    const mediaState =
      this.mediaStates_.get(MediaType.VIDEO) ||
      this.mediaStates_.get(MediaType.AUDIO);

    console.assert(
      mediaState?.stream.segmentIndex.hasTime(this.startTime_),
      'Bug: Start time is not within the presentation timeline'
    );

    console.log('Start time:', this.startTime_);

    // Set the start time
    this.mse_.setCurrentTime(this.startTime_);

    for (const mediaState of this.mediaStates_.values()) {
      // Start streaming
      this.onTick_(mediaState);
      // Setup scheduler
      mediaState.scheduleTimer = new Timer(() => this.onTick_(mediaState));
      mediaState.scheduleTimer.tickEvery(this.scheduleInterval);
    }

    return true;
  }

  /**
   * Stop streaming.
   */
  stop(): void {
    this.stopped_ = true;
    this.mse_.closeMediaSource();
    for (const mediaState of this.mediaStates_.values()) {
      mediaState.scheduleTimer?.clear();
      mediaState.updating = false;
    }
  }

  /**
   * @returns The presentation time we started streaming at
   */
  getStartTime(): number | null {
    return this.startTime_;
  }

  /**
   * Get the stream of type |mediaType| being currently buffered
   *
   * @param mediaType The media type
   * @returns The active |mediaType| stream or null
   */
  getActiveStream(mediaType: MediaType): IRepresentation | null {
    const mediaState = this.mediaStates_.get(mediaType);
    if (mediaState) {
      return mediaState.stream;
    }
    return null;
  }

  /**
   * Called when a stream's scheduler timer ticked. This will check, for an
   * idling stream, if there is a segment to download in which case
   * |fetchAndAppend_()| will be called to perform the actually download
   * and push the data to the source buffer (via the MSE adapter).
   *
   * @param mediaState The media state of the currently scheduled stream.
   * @returns Promise.
   */
  private async onTick_(mediaState: MediaState): Promise<void> {
    if (this.stopped_) {
      // Streaming has been stopped
      return;
    }

    if (mediaState.updating) {
      // Media state is still updating
      return;
    }

    // Check if we should buffer more
    const bufferingGoal = 30;
    const playheadPosition = this.presentation_.getPosition();
    const bufferedAhead = this.mse_.getBufferedAheadOf(
      mediaState.type,
      playheadPosition
    );
    if (bufferedAhead > bufferingGoal) {
      return;
    }

    mediaState.updating = true;

    try {
      const timeNeeded = this.getTimeNeeded_(mediaState);
      const nextSegment = mediaState.stream.segmentIndex.find(timeNeeded);

      if (nextSegment) {
        if (mediaState.needInit) {
          const initSegment = mediaState.stream.initialization;
          await this.fetchAndAppend_(mediaState, initSegment);
        }

        await this.fetchAndAppend_(mediaState, nextSegment);
        mediaState.lastSegment = nextSegment;
      }
    } catch (e) {
      const netRespone = e as IHttpResponse;
      if (netRespone.status && netRespone.status === 404) {
        console.info(
          'Segment present in manifest but server returned HTTP 404.',
          'Will rety...'
        );
      } else {
        console.error('(streaming) Fetch and append failed...', e);
        // throw e;
      }
    } finally {
      mediaState.updating = false;
    }
  }

  /**
   * Fetch segment and push data to buffer.
   *
   * @param mediaState The stream's state/context.
   * @param segment The segment to download.
   */
  private async fetchAndAppend_(
    mediaState: MediaState,
    segment: ISegment
  ): Promise<void> {
    const request = new HttpRequest(segment.url);
    request.responseType = 'arraybuffer';

    const response = await NetworkHandle.fetch(request);
    await this.mse_.appendBuffer(mediaState.type, response.data as ArrayBuffer);

    if (segment.isInit) {
      mediaState.needInit = false;
    }
  }

  /**
   * Get next timestamp we need to buffer.
   *
   * @param mediaState The stream state/context.
   * @returns The time needed.
   */
  private getTimeNeeded_(mediaState: MediaState): number {
    if (mediaState.lastSegment) {
      return mediaState.lastSegment.end;
    }
    return this.presentation_.getPosition();
  }

  /**
   * Computes the live edge.
   * @returns The live edge
   */
  private getLiveEdge_(): number {
    console.assert(
      this.presentation_.isLive(),
      'Invalid call to getLiveEdge_()'
    );
    const maxSegmentDuration = this.presentation_.getMaxSegmentDuration();
    const presentationStartTime = this.presentation_.getStartTime();
    const now = Date.now() / 1000;

    return Math.max(0, now - maxSegmentDuration - presentationStartTime);
  }

  private createMediaState_(
    type: MediaType,
    stream: IRepresentation
  ): MediaState {
    return {
      type,
      stream,
      needInit: true,
      lastSegment: null,
      updating: false,
      scheduleTimer: null,
    };
  }
}
