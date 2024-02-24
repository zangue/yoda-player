export interface ISegment {
  start: number;
  end: number;
  duration: number;
  unscaledStart: number;
  unscaledEnd: number;
  unscaledDuration: number;
  isInit: boolean;
  url: string;
}

export interface IRepresentation {
  id: string;
  originalId: string;
  type: MediaType;
  kbps: number;
  width: number | null;
  height: number | null;
  frameRate: number | null;
  codecs: string;
  mimeType: string;
  initialization: ISegment;
  segmentIndex: ISegmentIndex;
}

export interface IManifest {
  type: StreamType;
  startTime: number;
  delay: number;
  duration: number;
  dvrWindowLength: number;
  minBufferTime: number;
  minUpdatePeriod: number;
  maxSegmentDuration: number;
  video: IRepresentation[];
  audio: IRepresentation[];
}

export interface IManifestParser {
  start(manifestUrl: string): Promise<IManifest>;
  stop(): Promise<void>;
}

export enum MediaType {
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum StreamType {
  LIVE,
  VOD,
}

export interface ISegmentIndex {
  getSegments(): ISegment[];
  merge(newSegments: ISegment[]): void;
  find(time: number): ISegment | null;
  getStartTime(unscaled?: boolean): number;
  getEndTime(unscaled?: boolean): number;
  adjustDvrWindow(dvrWindowLength: number): void;
  isContiguous(segments: ISegment[]): boolean;
  hasTime(time: number): boolean;
}

export interface IPresentation {
  isLive(): boolean;
  getStartTime(): number;
  getMaxSegmentDuration(): number;
  getDelay(): number;
  getPosition(): number;
  getDuration(): number;
}
