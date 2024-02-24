import {ParserUtils as Utils} from './parser-utils';
import {SegmentIndex} from './segment-index';
import {Timer} from '../utils/timer';
import {NetworkHandle, HttpRequest} from '../utils/network';
import {ITimer} from '../utils/types';
import {
  ISegment,
  IRepresentation,
  IManifest,
  IManifestParser,
  MediaType,
  StreamType,
} from './types';

type AdaptationSetContext = {
  id: string;
  mimeType: string;
  contentType: string;
  codecs: string;
  segmentTemplate: Element;
};

type RepresentationContext = {
  id: string;
  bandwidth: number;
  adaptationSet: AdaptationSetContext;
};

type MediaDataContext = {
  startNumber: number;
  segmentDuration: number;
  timeOffset: number;
  timescale: number;
  initializationAttr: string;
  mediaAttr: string;
  representation: RepresentationContext;
};

type AllSegments = {
  initSegment: ISegment;
  mediaSegments: ISegment[];
};

/**
 * A MPEG-DASH Manifest parser.
 *
 * The parser is tailored to consume Zattoo Live stream with respect of the
 * scope of the case study. MPEG-DASH feature beyond the scope of the case
 * study may not be supported.
 */
export class ManifestParser implements IManifestParser {
  private manifestUrl_: string;
  private manifest_: IManifest | null;
  private maxSegmentDuration_: number;
  private presentationDuration_: number | null;
  private streamMap_: Map<MediaType, IRepresentation[]>;
  private globalId_: 0;
  private refreshTimer_: ITimer;

  constructor() {
    this.manifestUrl_ = '';
    this.manifest_ = null;
    this.maxSegmentDuration_ = -1;
    this.presentationDuration_ = null;
    this.streamMap_ = new Map();
    this.globalId_ = 0;
    this.refreshTimer_ = new Timer(() => this.refreshManifest_());
  }

  /**
   * Starts the parser. This method will load and parse the manifest.
   *
   * @param manifestUrl The manifest URL
   * @returns Promise containing the parsed manifest.
   */
  async start(manifestUrl: string): Promise<IManifest> {
    console.log('Manifest parser starts...');

    this.manifestUrl_ = manifestUrl;

    this.manifest_ = await this.loadAndParseManifest_();

    if (this.manifest_.type === StreamType.LIVE) {
      this.refreshTimer_.tickAfter(this.manifest_.minUpdatePeriod);
    }

    return this.manifest_;
  }

  /**
   * Stop parsing.
   */
  async stop(): Promise<void> {
    console.log('Manifest parser stops...');
    this.refreshTimer_.clear();
    this.globalId_ = 0;
    this.streamMap_.clear();
    this.maxSegmentDuration_ = -1;
  }

  private async loadAndParseManifest_(): Promise<IManifest> {
    const req = new HttpRequest(this.manifestUrl_);
    req.responseType = 'text';

    const respone = await NetworkHandle.fetch(req);
    const mpd = Utils.parseXml(respone.data as string);

    if (!mpd) {
      throw new Error('Invalid Manifest');
    }

    this.presentationDuration_ =
      Utils.parseIsoDuration(
        mpd.getAttribute('mediaPresentationDuration') || ''
      ) || null;
    const presentationType = mpd.getAttribute('type');
    const minBufferTime =
      Utils.parseIsoDuration(mpd.getAttribute('minBufferTime') || '') || -1;
    const presentationStartTime =
      Utils.parseDate(mpd.getAttribute('availabilityStartTime') || '') || 0;
    const suggestedPresentationDelay = Utils.parseIsoDuration(
      mpd.getAttribute('suggestedPresentationDelay') || ''
    );
    const minimumUpdatePeriod =
      Utils.parseIsoDuration(mpd.getAttribute('minimumUpdatePeriod') || '') ||
      -1;
    const dvrWindowLength =
      Utils.parseIsoDuration(mpd.getAttribute('timeShiftBufferDepth') || '') ||
      Infinity;
    let presentationDelay = null;

    const periodNodes = Utils.getChildren(mpd, 'Period');

    if (periodNodes.length === 0) {
      console.error('No period found');
      throw new Error('Invalid manifest: no period found');
    }

    if (periodNodes.length > 1) {
      console.warn(
        'Multi-period manifests not supported. ' +
          'Additional periods will be ignored...'
      );
    }

    // Multi-period not supported yet!
    const period = periodNodes[0];
    const periodDuration =
      Utils.parseIsoDuration(period.getAttribute('duration') || '') || null;

    if (!this.presentationDuration_) {
      if (periodDuration) {
        this.presentationDuration_ = periodDuration;
      } else if (presentationType === 'dynamic') {
        this.presentationDuration_ = Number.MAX_SAFE_INTEGER;
      }
    }

    if (!this.presentationDuration_) {
      throw new Error('Could not determine presentation duration!');
    }

    // TODO - Period might contain segment infos

    const adaptationSetNodes = Utils.getChildren(period, 'AdaptationSet');

    adaptationSetNodes.forEach(this.parseAdaptationSet_.bind(this));

    if (suggestedPresentationDelay) {
      presentationDelay = suggestedPresentationDelay;
    } else {
      console.assert(
        this.maxSegmentDuration_ > 0,
        'Bug: Should have set max segment duration!'
      );
      presentationDelay = Math.round(this.maxSegmentDuration_ * 3);
    }

    const manifest: IManifest = {
      type: presentationType === 'dynamic' ? StreamType.LIVE : StreamType.VOD,
      startTime: presentationStartTime,
      delay: presentationDelay,
      duration: this.presentationDuration_,
      dvrWindowLength,
      minBufferTime,
      minUpdatePeriod: minimumUpdatePeriod,
      maxSegmentDuration: this.maxSegmentDuration_,
      video: this.streamMap_.get(MediaType.VIDEO) || [],
      audio: this.streamMap_.get(MediaType.AUDIO) || [],
    };

    // We done parsing clear stream map
    this.streamMap_.clear();

    return manifest;
  }

  private parseAdaptationSet_(elem: Element): void {
    const id = elem.getAttribute('id') || String(this.globalId_++);
    const mimeType = elem.getAttribute('mimeType') || '';
    const codecs = elem.getAttribute('codecs') || '';
    const contentType =
      elem.getAttribute('contentType') || Utils.getTypeFromMimeType(mimeType);
    const segmentTemplate = Utils.getFirstChild(elem, 'SegmentTemplate');
    const segmentBase = Utils.getFirstChild(elem, 'SegmentBase');
    const segmentList = Utils.getFirstChild(elem, 'SegmentList');

    // We only parse video and audio streams!
    if (contentType !== MediaType.VIDEO && contentType !== MediaType.AUDIO) {
      return;
    }

    if (segmentBase || segmentList) {
      console.warn('Currently only SegmentTemplate is supported!');
      return;
    }

    if (!segmentTemplate) {
      console.error('No support for manifest type!');
      throw new Error(
        'Only DASH manifest with segment template are supported!'
      );
    }

    if (this.streamMap_.has(contentType)) {
      console.warn(
        'Multiple adaptation sets for same content type is not supported...'
      );
      return;
    }

    const representationNodes = Utils.getChildren(elem, 'Representation');
    const streams = [];

    for (const representationNode of representationNodes) {
      const context: AdaptationSetContext = {
        id,
        mimeType,
        contentType,
        codecs,
        segmentTemplate,
      };
      const parsed = this.parseRepresentation_(representationNode, context);

      if (parsed) {
        streams.push(parsed);
      }
    }

    if (streams.length < 1) {
      console.error('Empty AdaptationSet!');
      throw new Error(
        `Invalid manifest: no represenation found for ${contentType}`
      );
    }

    this.streamMap_.set(contentType, streams);
  }

  private parseRepresentation_(
    elem: Element,
    context: AdaptationSetContext
  ): IRepresentation {
    const originalId = elem.getAttribute('id') || '';
    const bandwidth = Number(elem.getAttribute('bandwidth'));
    const width = Number(elem.getAttribute('width'));
    const height = Number(elem.getAttribute('height'));
    const codecs = elem.getAttribute('codecs') || context.codecs;
    const frameRate = Number(elem.getAttribute('frameRate'));
    const segmentTemplate =
      Utils.getFirstChild(elem, 'SegmentTemplate') || context.segmentTemplate;

    const rContext: RepresentationContext = {
      id: originalId,
      bandwidth,
      adaptationSet: context,
    };

    const mediaData = this.parseSegmentTemplate_(segmentTemplate, rContext);

    console.assert(
      mediaData.mediaSegments.length > 0,
      'Should have parsed segments'
    );

    return {
      // TODO
      id:
        context.contentType +
        '_' +
        context.id +
        '_' +
        (originalId ? originalId : String(this.globalId_++)),
      originalId,
      type: context.contentType as MediaType,
      kbps: bandwidth / 1000,
      width,
      height,
      frameRate,
      codecs,
      mimeType: context.mimeType,
      initialization: mediaData.initSegment,
      segmentIndex: new SegmentIndex(mediaData.mediaSegments),
    };
  }

  private parseSegmentTemplate_(
    elem: Element,
    context: RepresentationContext
  ): AllSegments {
    // Section 5.3.9.2.2
    const presentationTimeOffset = Number(
      elem.getAttribute('presentationTimeOffset')
    );
    const timescale = Number(elem.getAttribute('timescale')) || 1;
    const segmentDuration = Number(elem.getAttribute('duration')) || -1;
    const initialization = elem.getAttribute('initialization') || '';
    const media = elem.getAttribute('media') || '';
    const startNumber = Number(elem.getAttribute('startNumber')) || 1;
    const segmentTimeline = Utils.getFirstChild(elem, 'SegmentTimeline');

    const mContext: MediaDataContext = {
      startNumber,
      segmentDuration,
      timeOffset: presentationTimeOffset,
      timescale,
      initializationAttr: initialization,
      mediaAttr: media,
      representation: context,
    };

    // Segment template with timeline.
    if (segmentTimeline) {
      return this.createSegmentsFromTimeline_(segmentTimeline, mContext);
    }

    return this.createSegmentsFromTemplate_(mContext);
  }

  private createSegmentsFromTemplate_(context: MediaDataContext): AllSegments {
    console.assert(
      context.segmentDuration > 0,
      'Segment template without timeline should have segment duration'
    );
    if (!this.presentationDuration_) {
      throw new Error('Missing presentation duration!');
    }
    const segments = [];
    let position = context.startNumber;
    const scaledSegmentDuration = context.segmentDuration / context.timescale;
    let start = 0;
    let end = scaledSegmentDuration;

    // TODO
    this.maxSegmentDuration_ = end - start;

    while (end < this.presentationDuration_) {
      const unscaledStart = start * context.timescale;
      const unscaledEnd = end * context.timescale;
      segments.push({
        start,
        end,
        duration: end - start,
        unscaledStart,
        unscaledEnd,
        unscaledDuration: unscaledEnd - unscaledStart,
        isInit: false,
        url: Utils.resolveTemplateUrl(
          context.mediaAttr,
          {
            representationId: context.representation.id,
            bandwidth: context.representation.bandwidth,
            time: unscaledStart,
            number: position,
          },
          this.manifestUrl_
        ),
      });

      start = end;
      end = Math.min(this.presentationDuration_, end + scaledSegmentDuration);
      ++position;
    }

    console.assert(segments.length > 0, 'Should have segments!!!');

    return {
      initSegment: {
        start: 0,
        end: 0,
        duration: 0,
        unscaledStart: 0,
        unscaledEnd: 0,
        unscaledDuration: 0,
        isInit: true,
        url: Utils.resolveTemplateUrl(
          context.initializationAttr, // Init Url template
          {
            representationId: context.representation.id,
            bandwidth: context.representation.bandwidth,
          },
          this.manifestUrl_
        ),
      },
      mediaSegments: segments,
    };
  }

  private createSegmentsFromTimeline_(
    elem: Element,
    context: MediaDataContext
  ): AllSegments {
    // Section 5.3.9.6
    const sNodes = Utils.getChildren(elem, 'S');
    const mediaSegments: ISegment[] = [];

    for (const sNode of sNodes) {
      const d = Number(sNode.getAttribute('d'));
      const r = Number(sNode.getAttribute('r'));
      let t = null;
      let scaledT = null;
      const scaledD = d / context.timescale;

      // TODO - Assert has duration

      if (sNode.hasAttribute('t')) {
        t = Number(sNode.getAttribute('t')) - context.timeOffset;
      } else if (mediaSegments.length === 0) {
        // If @t not present, then the value shall be assumed zero for the
        // first S element.
        t = 0;
      } else {
        // If @t not present, and not the first S element then the value
        // shall be assumed to be the sum of the previous S element's earliest
        // presentation time and contiguous duration i.e. end time for previous
        // segment.
        const lastSegment = mediaSegments[mediaSegments.length - 1];
        t = lastSegment.unscaledStart + lastSegment.unscaledDuration;
      }

      const unscaledEnd = t + d;

      scaledT = t / context.timescale;

      // TODO - Check for discontinuity
      if (this.maxSegmentDuration_ < scaledD) {
        this.maxSegmentDuration_ = scaledD;
      }

      mediaSegments.push({
        start: scaledT,
        end: unscaledEnd / context.timescale,
        duration: scaledD,
        unscaledStart: t,
        unscaledEnd,
        unscaledDuration: d,
        isInit: false,
        url: Utils.resolveTemplateUrl(
          context.mediaAttr, // url template
          {bandwidth: context.representation.bandwidth, time: t},
          this.manifestUrl_
        ),
      });

      if (r < -1) {
        console.warn('Negative repeat count not supported at the moment');
      }

      if (r > 0) {
        for (let i = 0; i <= r; i++) {
          const lastSegment = mediaSegments[mediaSegments.length - 1];

          const nextStartUnscaled = lastSegment.unscaledEnd;
          const nextEndUnscaled = nextStartUnscaled + d;

          mediaSegments.push({
            start: lastSegment.end,
            end: nextEndUnscaled / context.timescale,
            duration: scaledD,
            unscaledStart: nextStartUnscaled,
            unscaledEnd: nextEndUnscaled,
            unscaledDuration: d,
            isInit: false,
            url: Utils.resolveTemplateUrl(
              context.mediaAttr,
              {
                bandwidth: context.representation.bandwidth,
                time: nextStartUnscaled,
              },
              this.manifestUrl_
            ),
          });
        }
      }
    }

    return {
      initSegment: {
        start: 0,
        end: 0,
        duration: 0,
        unscaledStart: 0,
        unscaledEnd: 0,
        unscaledDuration: 0,
        isInit: true,
        url: Utils.resolveTemplateUrl(
          context.initializationAttr, // Init Url template
          {
            representationId: context.representation.id,
            bandwidth: context.representation.bandwidth,
          },
          this.manifestUrl_
        ),
      },
      mediaSegments,
    };
  }

  private async refreshManifest_(): Promise<void> {
    if (!this.manifest_) return;

    console.log('Refreshing manifest...');

    try {
      const newManifest = await this.loadAndParseManifest_();

      // TODO
      this.manifest_.dvrWindowLength = newManifest.dvrWindowLength;
      this.manifest_.minUpdatePeriod = newManifest.minUpdatePeriod;

      // Update streams
      if (this.manifest_.video && newManifest.video) {
        this.updateStreams_(
          this.manifest_.video,
          newManifest.video,
          this.manifest_.dvrWindowLength
        );
      }
      if (this.manifest_.audio && newManifest.audio) {
        this.updateStreams_(
          this.manifest_.audio,
          newManifest.audio,
          this.manifest_.dvrWindowLength
        );
      }

      // TODO: Notify new manifest?

      // Schedule next update
      this.refreshTimer_.tickAfter(this.manifest_.minUpdatePeriod);
    } catch (error) {
      console.error('Failed to refresh manifest, retrying...', error);
      // Retry
      this.refreshTimer_.tickAfter(0);
    }
  }

  private updateStreams_(
    oldStreams: IRepresentation[],
    newStreams: IRepresentation[],
    dvrWindowLength: number
  ): void {
    console.assert(
      oldStreams.length === newStreams.length,
      'Stream count missmatch after manifest update!'
    );
    // TODO
    // Improve the stream mapping. For simplicity sake we will assume, for
    // now, that streams appears in each manifest in the same order and
    // in the same amount i.e. we assume an 1:1 mapping with the new
    // manifest.
    for (let i = 0; i < oldStreams.length; i++) {
      const newSegments = newStreams[i].segmentIndex.getSegments();

      oldStreams[i].segmentIndex.merge(newSegments);

      // Adjust DVR window
      if (dvrWindowLength) {
        oldStreams[i].segmentIndex.adjustDvrWindow(dvrWindowLength);
      }
    }
  }
}
