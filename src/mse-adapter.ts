import { ParserUtils } from './dash/parser-utils';
import { IRepresentation, MediaType } from './dash/types';
import { AsyncTask } from './utils/async-task';
import { TimeRangesUtils } from './utils/time-ranges';


export interface IMseAdapter {
  openMediaSource () : Promise<void>;
  closeMediaSource () : void;
  setupSourceBuffers (streamMap: Map<MediaType, IRepresentation>) : Promise<void>;
  appendBuffer (mediaType: MediaType, data: ArrayBuffer) : Promise<void>;
  setCurrentTime (time: number) : void;
  setDuration (duration: number) : void;
  getBufferedAheadOf (mediaType: MediaType, time: number) : number;
  getBufferEnd (mediaType: MediaType) : number | null;
  stop () : void;
}


type BufferAppendContext = {
  mediaType: MediaType;
  data: ArrayBuffer;
  operation: AsyncTask<void>;
  scheduled: boolean;
}

type EventCallback = (e: Event) => any;

/**
 * The a wrapper class around the MSE APIs to provide a "better" handle thereof.
 */
export class MseAdapter implements IMseAdapter {
  private video_: HTMLMediaElement;
  private mediaSource_: MediaSource | null = null;
  private objectUrl_: string = '';
  private sourceBuffers_: Map<MediaType, SourceBuffer> = new Map();
  private mediaSourceOpenTask_: AsyncTask<void>;
  private appendQ_: Map<MediaType, BufferAppendContext[]> = new Map();
  private onUpdateEndVideo_: EventCallback;
  private onErrorVideo_: EventCallback;
  private onUpdateEndAudio_: EventCallback;
  private onErrorAudio_: EventCallback;


  constructor (video: HTMLMediaElement) {
    this.video_ = video;
    this.mediaSourceOpenTask_ = new AsyncTask<void>();
    this.onUpdateEndVideo_ = (_) => {
      this.onUpdateEnd_(MediaType.VIDEO);
    };
    this.onErrorVideo_ = (e) => {
      console.log('(mse) video source buffer error', e);
    }
    this.onUpdateEndAudio_ = (_) => {
      this.onUpdateEnd_(MediaType.AUDIO);
    };
    this.onErrorAudio_ = (e) => {
      console.log('(mse) audio source buffer error', e);
    }
  }


  openMediaSource () : Promise<void> {
    const onSourceOpen = () => {
      console.log('media source is open...');

      this.mediaSource_?.removeEventListener(
          'sourceopen', onSourceOpen);

      this.mediaSourceOpenTask_.done();
    };

    this.mediaSource_ = new MediaSource();
    this.mediaSource_.addEventListener('sourceopen', onSourceOpen);
    this.objectUrl_ = window.URL.createObjectURL(this.mediaSource_);
    this.video_.src = this.objectUrl_;

    return this.mediaSourceOpenTask_.promise;
  }


  stop () : void {
    // TODO - Abort ongoing operations on source buffers first!
    this.sourceBuffers_.forEach((sourceBuffer, mediaType) => {
      if (mediaType === MediaType.VIDEO) {
        sourceBuffer.removeEventListener('error', this.onErrorVideo_);
        sourceBuffer.removeEventListener('updateend', this.onUpdateEndVideo_);
      }
    });
  }


  closeMediaSource () : void {
    this.stop();

    if (this.objectUrl_) {
      window.URL.revokeObjectURL(this.objectUrl_);
    }

    this.sourceBuffers_.forEach(sourceBuffer => {
      this.mediaSource_?.removeSourceBuffer(sourceBuffer);
    });

    this.mediaSource_ = null;
  };


  async setupSourceBuffers (
      streamMap: Map<MediaType, IRepresentation>) : Promise<void> {
    await this.mediaSourceOpenTask_;

    if (!this.mediaSource_) {
      throw new Error('No MediaSource!');
    }

    const videoStream = streamMap.get(MediaType.VIDEO);
    const audioStream = streamMap.get(MediaType.AUDIO);

    if (videoStream) {
      this.addSourceBuffer_(MediaType.VIDEO, videoStream);
    }

    if (audioStream) {
      this.addSourceBuffer_(MediaType.AUDIO, audioStream);
    }

    if (this.sourceBuffers_.size < 1) {
      console.warn('Could not setup source buffers...');
    }
  }


  appendBuffer (mediaType: MediaType, data: ArrayBuffer) : Promise<void> {
    const sourceBuffer = this.sourceBuffers_.get(mediaType);

    if (sourceBuffer) {
      if (!this.appendQ_.has(mediaType)) {
        this.appendQ_.set(mediaType, []);
      }

      const appendContext: BufferAppendContext = {
        mediaType,
        data,
        operation: new AsyncTask<void>(),
        scheduled: false
      };

      this.appendQ_.get(mediaType)?.push(appendContext);
      this.runQueue_(mediaType);
      return appendContext.operation.promise;
    }

    return Promise.reject();
  }


  setCurrentTime (time: number) : void {
    console.assert(time >= 0, 'Current time can not be negative');
    this.video_.currentTime = time;
  }


  setDuration (duration: number) : void {
    if (this.mediaSource_) {
      this.mediaSource_.duration = duration;
    }
  }


  getBufferEnd (mediaType: MediaType): number | null {
    const sourceBuffer = this.sourceBuffers_.get(mediaType);
    if (sourceBuffer) {
      try {
        const ranges = sourceBuffer.buffered;

        if (ranges !== null && typeof ranges !== 'undefined' && ranges.length) {
          return ranges.end(ranges.length - 1);
        }
      } catch (e) {
        console.error('Could not get time ranges for ', mediaType, e);
      }
    }
    return null;
  }


  getBufferedAheadOf (mediaType: MediaType, time: number) : number {
    let bufferedAhead = 0;
    const sourceBuffer = this.sourceBuffers_.get(mediaType);
    if (sourceBuffer) {
      try {
        const ranges = sourceBuffer.buffered;
        bufferedAhead = TimeRangesUtils.bufferedAheadOf(ranges, time);
      } catch (e) {
        console.error('Could not get time ranges for ', mediaType, e);
      }
    }
    return bufferedAhead;
  }


  private onUpdateEnd_ (mediaType: MediaType) {
    const queue = this.appendQ_.get(mediaType);
    // Pop from queue
    const context = queue?.shift()

    if (context) {
      console.assert(
          context.scheduled,
          'Bug: (mse) first item in the queue should have been scheduled!');

      // Resolve operation promise
      context.operation.done();
      // Run queue
      this.runQueue_(mediaType);
    }
  }


  private runQueue_ (mediaType: MediaType) : void {
    const sourceBuffer = this.sourceBuffers_.get(mediaType);
    const queue = this.appendQ_.get(mediaType);

    console.assert(
        !!queue || !!sourceBuffer, 'Bug: (mse) invalid call to runQueue_()');

    if (!queue || !sourceBuffer) {
      console.warn('Unsuccessful attempt to update buffer');
      return;
    }

    if (queue.length === 0) {
      // Nothing to to
      return;
    }

    if (sourceBuffer.updating) {
      // Wait for updateend
      return;
    }

    // FIFO
    const next = queue[0];

    console.assert(
        !next.scheduled, 'Bug: (mse) found scheduled item in run queue!');

    next.scheduled = true;
    sourceBuffer.appendBuffer(new Uint8Array(next.data));
  }

  /**
   * Create a source buffer for |mediaType| and add it to the media source
   * @param mediaType
   * @param stream
   */
  private addSourceBuffer_ (
      mediaType: MediaType, stream: IRepresentation) : void {
    if (this.mediaSource_) {
      const fullMimeType = ParserUtils.getFullMimeType(stream);
      const supportedByPlatform = MediaSource.isTypeSupported(fullMimeType)

      console.assert(
          mediaType === MediaType.VIDEO || mediaType === MediaType.AUDIO,
          'Invalid media type!');

      console.assert(
        supportedByPlatform,
        'Type must supported by platform!', fullMimeType);

      if (!supportedByPlatform) {
        console.warn(
            `Skipping ${mediaType} stream because not supported by platform.`);
        return;
      }

      const sourceBuffer = this.mediaSource_.addSourceBuffer(fullMimeType);

      if (mediaType === MediaType.VIDEO) {
        sourceBuffer.addEventListener('updateend', this.onUpdateEndVideo_);
        sourceBuffer.addEventListener('error', this.onErrorVideo_);
        this.sourceBuffers_.set(MediaType.VIDEO, sourceBuffer);
      }

      if (mediaType === MediaType.AUDIO) {
        sourceBuffer.addEventListener('updateend', this.onUpdateEndAudio_);
        sourceBuffer.addEventListener('error', this.onErrorAudio_);
        this.sourceBuffers_.set(MediaType.AUDIO, sourceBuffer);
      }
    }
  }
}
