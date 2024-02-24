import { IManifest, IManifestParser, IPresentation, IRepresentation, MediaType, StreamType } from './dash/types';
import { IMseAdapter, MseAdapter } from './mse-adapter';
import { Streamer } from './streamer';
import { ManifestParser as DashParser } from './dash/manifest-parser';


interface ITrack {
  id: string;
  originalId: string;
  type: MediaType;
  kbps: number;
  codecs: string;
  mimeType: string;
}
interface IVideoTrack extends ITrack {
  width: number;
  height: number;
  frameRate: number;
}

interface IAudioTrack extends ITrack {}

/**
 * A minimal MPEG-DASH player.
 */
export class Player {
  private video_: HTMLMediaElement;
  private manifestUrl_: string = '';
  private manifest_: IManifest | null = null;
  private parser_: IManifestParser | null = null;
  private mse_: IMseAdapter | null = null;
  private streamer_: Streamer | null = null;

  constructor (video: HTMLMediaElement) {
    this.video_ = video;
  }


  /**
   * Loads and play the provided content.
   *
   * @param streamUrl The content URL.
   * @return Promise.
   */
  async load (streamUrl: string) : Promise<void> {
    this.manifestUrl_ = streamUrl;
    this.parser_ = new DashParser();
    this.mse_ = new MseAdapter(this.video_);
    this.streamer_ = new Streamer(this.mse_, this.getPresentationImpl_());

    this.manifest_ = await this.parser_.start(this.manifestUrl_);

    const initStreams: Map<MediaType, IRepresentation> = new Map();

    initStreams.set(
        MediaType.VIDEO, this.pickHighestKbps_(this.manifest_.video));
    initStreams.set(
        MediaType.AUDIO, this.pickHighestKbps_(this.manifest_.audio));

    await this.streamer_.setup(initStreams);
    const streamingStarted = await this.streamer_.start();
    if (streamingStarted) {
      this.video_.play();
    } else {
      console.error('Could not start streaming!');
      throw Error('Streaming Start failed');
    }
  }


  /**
   * Stops the player.
   */
  async stop () : Promise<void> {
    if (this.parser_) {
      this.parser_.stop();
      this.parser_ = null;
    }

    if (this.streamer_) {
      this.streamer_.stop();
    }

    if (this.mse_) {
      this.mse_ = null;
    }
  }


  /**
   * Get all video tracks.
   * @returns All available video tracks
   */
  getAllVideo () : IVideoTrack[] {
    if (this.manifest_ && this.manifest_.video.length > 0) {
      return this.manifest_.video.map(video => this.getPublicVideo_(video));
    }
    return [];
  }


  /**
   * Get all audio tracks.
   * @returns All available audio tracks.
   */
  getAllAudio () : IAudioTrack[] {
    if (this.manifest_ && this.manifest_.audio.length > 0) {
      return this.manifest_.audio.map(audio => this.getPublicAudio_(audio));
    }
    return [];
  }

  /**
   * Get the active (currently buffering) video stream.
   * @returns The currently active video stream or null.
   */
  getActiveVideo () : IVideoTrack | null {
    const active = this.streamer_?.getActiveStream(MediaType.VIDEO) || null;
    if (active) {
      return this.getPublicVideo_(active);
    }
    return active;
  }


  /**
   * Get the active (currently buffering) audio stream.
   * @returns The currently active audio stream or null.
   */
  getActiveAudio () : IAudioTrack | null {
    const active = this.streamer_?.getActiveStream(MediaType.AUDIO) || null;
    if (active) {
      return this.getPublicAudio_(active);
    }
    return null;
  }

  isLive () : boolean {
    if (this.manifest_ && this.manifest_.type === StreamType.LIVE) {
      return true;
    }
    return false;
  }


  /**
   * @returns An implementation of IPresentation.
   */
  private getPresentationImpl_ () : IPresentation {
    return {
      isLive: () => this.isLive(),
      getStartTime: () => (this.manifest_ && this.manifest_.startTime) || 0,
      getMaxSegmentDuration: () => {
        if (this.manifest_) {
          return this.manifest_.maxSegmentDuration;
        }
        return 0;
      },
      getDelay: () => {
        if (this.manifest_) {
          return this.manifest_.delay;
        }
        return 0;
      },
      getPosition: () => this.video_.currentTime || 0, // TODO: Mind ready state
      getDuration: () => {
        if (this.manifest_) {
          return this.manifest_.duration;
        }
        return 0;
      }
    };
  }


  private pickHighestKbps_ (streams: IRepresentation[]) : IRepresentation {
    return streams.reduce((s1, s2) => (s1.kbps > s2.kbps) ? s1 : s2);
  }


  private getPublicVideo_ (video: IRepresentation) : IVideoTrack {
    return {
      id: video.id,
      originalId: video.originalId,
      type: video.type,
      kbps: video.kbps,
      codecs: video.codecs,
      mimeType: video.mimeType,
      width: video.width as number,
      height: video.height as number,
      frameRate: video.frameRate as number
    };
  }


  private getPublicAudio_ (audio: IRepresentation) : IAudioTrack {
    return {
      id: audio.id,
      originalId: audio.originalId,
      type: audio.type,
      kbps: audio.kbps,
      codecs: audio.codecs,
      mimeType: audio.mimeType
    };
  }
}
