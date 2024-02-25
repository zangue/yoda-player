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

// type PeriodContext = {
//   id: string;
//   duration: number;
// }

enum SegmentIndexType {
  Base,
  Template,
  Timeline,
}

type CommonAttributesAndElements = {
  width: number | null;
  height: number | null;
  frameRate: number | null;
  mimeType: string;
  codecs: string;
  samplingRate: number | null;
};

type AdaptationSetContext = {
  id: string;
  contentType: string;
  codecs: string;
  maxHeight: number;
  maxWidth: number;
  maxFrameRate: number;
  maxBandwidth: number;
  mimeType: string;
  segmentNode: {
    node: Element;
    indexType: SegmentIndexType;
  } | null;
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

// TODO
// Introduce |parseMandatoryAttr| utilities that will abort the parsing
// operation in case a mandatory attribute is not provided.

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
  private minimumUpdatePeriod_: number;
  private presentationType_: StreamType;
  private presentationDuration_: number | null;
  private streamMap_: Map<MediaType, IRepresentation[]>;
  private globalId_: 0;
  private refreshTimer_: ITimer;

  constructor() {
    this.manifestUrl_ = '';
    this.manifest_ = null;
    this.maxSegmentDuration_ = -1;
    this.presentationType_ = StreamType.VOD;
    this.presentationDuration_ = null;
    this.minimumUpdatePeriod_ = -1;
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
    this.presentationType_ =
      mpd.getAttribute('type') === 'dynamic' ? StreamType.LIVE : StreamType.VOD;
    const minBufferTime =
      Utils.parseIsoDuration(mpd.getAttribute('minBufferTime') || '') || -1;
    const presentationStartTime =
      Utils.parseDate(mpd.getAttribute('availabilityStartTime') || '') || 0;
    const suggestedPresentationDelay = Utils.parseIsoDuration(
      mpd.getAttribute('suggestedPresentationDelay') || ''
    );
    this.minimumUpdatePeriod_ =
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
      } else if (this.presentationType_ === StreamType.LIVE) {
        this.presentationDuration_ = Number.MAX_SAFE_INTEGER;
      } else {
        throw new Error('Could not determine presentation duration!');
      }
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
      type: this.presentationType_,
      startTime: presentationStartTime,
      delay: presentationDelay,
      duration: this.presentationDuration_,
      dvrWindowLength,
      minBufferTime,
      minUpdatePeriod: this.minimumUpdatePeriod_,
      maxSegmentDuration: this.maxSegmentDuration_,
      video: this.streamMap_.get(MediaType.VIDEO) || [],
      audio: this.streamMap_.get(MediaType.AUDIO) || [],
    };

    // We done parsing clear stream map
    this.streamMap_.clear();

    return manifest;
  }

  private parseCommonAttributesAndElements_(
    elem: Element
  ): CommonAttributesAndElements {
    const width = Number(elem.getAttribute('width')) || null;
    const height = Number(elem.getAttribute('height')) || null;
    const frameRate = Number(elem.getAttribute('frameRate')) || null;
    const mimeType = elem.getAttribute('mimeType') || '';
    const codecs = elem.getAttribute('codecs') || '';
    const samplingRate = Number(elem.getAttribute('samplingRate')) || null;

    return {
      width,
      height,
      frameRate,
      mimeType,
      codecs,
      samplingRate,
    };
  }

  private parseAdaptationSet_(elem: Element): void {
    const id = elem.getAttribute('id') || String(this.globalId_++);
    const common = this.parseCommonAttributesAndElements_(elem);
    const codecs = common.codecs;
    const maxHeight = Number(elem.getAttribute('maxHeight'));
    const maxWidth = Number(elem.getAttribute('maxWidth'));
    const maxFrameRate = Number(elem.getAttribute('maxFrameRate'));
    const maxBandwidth = Number(elem.getAttribute('maxBandwidth'));
    let contentType =
      elem.getAttribute('contentType') ||
      Utils.getTypeFromMimeType(common.mimeType);
    const segmentTemplate = Utils.getFirstChild(elem, 'SegmentTemplate');
    const segmentBase = Utils.getFirstChild(elem, 'SegmentBase');
    const segmentList = Utils.getFirstChild(elem, 'SegmentList');

    if (segmentBase || segmentList) {
      console.warn('Currently only SegmentTemplate is supported!');
      return;
    }

    const getSegmentNode = () => {
      if (segmentTemplate) {
        return {
          node: segmentTemplate,
          indexType: SegmentIndexType.Template,
        };
      }
      return null;
    };

    const representationNodes = Utils.getChildren(elem, 'Representation');
    const streams = [];

    const context: AdaptationSetContext = {
      id,
      codecs,
      contentType,
      maxBandwidth,
      maxFrameRate,
      maxHeight,
      maxWidth,
      mimeType: common.mimeType,
      segmentNode: getSegmentNode(),
    };

    for (const representationNode of representationNodes) {
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

    // Derive content type in case attribute not present at adaptation set level
    contentType = contentType || context.contentType;

    console.assert(
      contentType,
      'Bug: Must have figured out content type by now.'
    );

    // We only support video and audio streams for now!
    if (contentType === MediaType.AUDIO || contentType === MediaType.VIDEO) {
      if (contentType && this.streamMap_.has(contentType)) {
        console.warn(
          'Multiple adaptation sets for same content type is not supported...'
        );
        return;
      }
      this.streamMap_.set(contentType, streams);
    } else {
      console.warn(`Skipping unsupported type: ${contentType}`);
    }
  }

  private parseRepresentation_(
    elem: Element,
    context: AdaptationSetContext
  ): IRepresentation {
    const originalId = elem.getAttribute('id') || '';
    const common = this.parseCommonAttributesAndElements_(elem);
    const bandwidth = Number(elem.getAttribute('bandwidth'));
    const width = Number(elem.getAttribute('width')) || context.maxWidth;
    const height = Number(elem.getAttribute('height')) || context.maxHeight;
    const codecs = common.codecs || context.codecs;
    const mimeType = common.mimeType || context.mimeType;
    const frameRate = Number(elem.getAttribute('frameRate'));
    let segmentTemplate = Utils.getFirstChild(elem, 'SegmentTemplate');
    const segmentBase = Utils.getFirstChild(elem, 'SegmentBase');
    const segmentList = Utils.getFirstChild(elem, 'SegmentList');

    console.assert(
      mimeType,
      'mimeType attribute is mandatory for represensations.'
    );

    if (
      context.segmentNode &&
      context.segmentNode.indexType === SegmentIndexType.Template
    ) {
      segmentTemplate = segmentTemplate || context.segmentNode.node;
    }

    if (segmentBase || segmentList) {
      console.warn('Currently only SegmentTemplate is supported!');
      throw new Error('Unsupported segment index type.');
    }

    if (!segmentTemplate) {
      console.error('No support for manifest type!');
      throw new Error(
        'Only DASH manifest with segment template are supported!'
      );
    }

    if (!context.contentType) {
      context.contentType = Utils.getTypeFromMimeType(mimeType);
    }

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
      mimeType,
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
    // MPEG-DASH Section 5.3.9.6
    const sNodes = Utils.getChildren(elem, 'S');
    const mediaSegments: ISegment[] = [];

    for (let i = 0; i < sNodes.length; i++) {
      const sNode = sNodes[i];
      const d = Number(sNode.getAttribute('d'));
      let r = Number(sNode.getAttribute('r'));
      let t = null;
      let scaledT = null;
      const scaledD = d / context.timescale;

      // TODO - Assert has duration

      if (sNode.hasAttribute('t')) {
        // The value of the @t attribute minus the value of the
        // @presentationTimeOffset specifies the MPD start time of the first
        // Segment in the series.
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
          {
            bandwidth: context.representation.bandwidth,
            time: t,
            representationId: context.representation.id,
          },
          this.manifestUrl_
        ),
      });

      // The value of the @r attribute of the S element may be set to a
      // negative value indicating that the duration indicated in @d is promised
      // to repeat until the S@t of the next S element or if it is the
      // last S element in the SegmentTimeline element until the end of the
      // Period or the next update of the MPD, i.e. it is treated in the same
      // way as the @duration attribute for a full period.
      if (r < 0) {
        console.assert(scaledT, 'Bug: Should scaled start time');

        const nextS = sNodes[i + 1];
        const isLastS = typeof nextS === 'undefined';
        let endTime = -1;

        if (isLastS) {
          // TODO
          // Pass period context. Currently we only support single period so,
          // period duration is presentation duration
          const periodEndTime = this.presentationDuration_ || t; //TODO
          const nextUpdateTime = t + this.minimumUpdatePeriod_;
          const isLive = this.presentationDuration_ === StreamType.LIVE;

          endTime = isLive ? nextUpdateTime : periodEndTime;
        } else {
          if (nextS.hasAttribute('t')) {
            endTime = Number(nextS.getAttribute('t')) - context.timeOffset;
          } else {
            throw new Error('Parser: next S element is missing @t attribute.');
          }
        }

        console.assert(
          endTime >= scaledT,
          'Bug: could not compute segments for negative repeat count'
        );

        r = Math.ceil((endTime - scaledT) / scaledD);
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
                representationId: context.representation.id,
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
