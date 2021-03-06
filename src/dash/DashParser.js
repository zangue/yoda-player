import MPD from "./mpd/MPD.js";
import Period from "./mpd/Period.js";
import AdaptationSet from "./mpd/AdaptationSet.js";
import Representation from "./mpd/Representation.js";
import ContentComponent from "./mpd/ContentComponent.js";
import BaseUrl from "./mpd/BaseUrl.js";
import Initialization from "./mpd/Initialization.js";
import RepresentationIndex from "./mpd/RepresentationIndex.js";
import Segment from "./mpd/Segment.js";

class DashParser {

    parseAttribute (node, attr) {
        return node.getAttribute(attr);
    }

    parseChildren (node, childrenTagName, parserCallback) {
        let children = node.children,
            parsedChildren = [],
            i;

        for (i = 0; i < children.length; i++) {
            if (children[i].tagName == childrenTagName) {
                let parsedChild = parserCallback(children[i]);
                parsedChildren.push(parsedChild);
            }
        }

        return parsedChildren;
    }

    addParsedChildrensParent (children, parent) {
        let i,
            updatedChildren = [];

        for (i = 0; i < children.length; i++) {
            children[i].setParent(parent);
            updatedChildren.push(children[i]);
        }

        return updatedChildren;
    }

    parseCommon(node, element) {
        element.profiles = this.parseAttribute(node, "profiles");
        element.width = this.parseAttribute(node, "width");
        element.height = this.parseAttribute(node, "height");
        element.sar = this.parseAttribute(node, "sar");
        element.frameRate = this.parseAttribute(node, "frameRate");
        element.audioSamplingRate = this.parseAttribute(node, "audioSamplingRate");
        element.mimeType = this.parseAttribute(node, "mimeType");
        element.segmentProfiles = this.parseAttribute(node, "segmentProfiles");
        element.codecs = this.parseAttribute(node, "codecs");
        element.maximumSAPPeriod = this.parseAttribute(node, "maximumSAPPeriod");
        element.startWithSAP = this.parseAttribute(node, "startWithSAP");
        element.maxPlayoutRate = this.parseAttribute(node, "maxPlayoutRate");
        element.codingDependency  = this.parseAttribute(node, "codingDependency");
        element.scanType = this.parseAttribute(node, "scanType");

        return element;
    }

    parseBaseUrl (node) {
        let baseUrl = new BaseUrl();

        baseUrl.serviceLocation = this.parseAttribute(node, "serviceLocation");
        baseUrl.byteRange = this.parseAttribute(node, "byteRange");
        baseUrl.availabilityTimeOffset = this.parseAttribute(node, "availabilityTimeOffset");
        baseUrl.availabilityTimeComplete = this.parseAttribute(node, "availabilityTimeComplete");
        baseUrl.url = node.textContent;

        return baseUrl;
    }

    parseInitialization (node) {
        let init = new Initialization(),
            elem = node.getElementsByTagName("Initialization")[0];

        if (elem) {
            init.sourceURL = this.parseAttribute(elem, "sourceURL");
            init.range = this.parseAttribute(elem, "range");
        } else {
            init = null;
        }

        return init;
    }

    parseRepresentationIndex (node) {
        let repIndex = new RepresentationIndex(),
            elem = node.getElementsByTagName("RepresentationIndex")[0];

        if (elem) {
            repIndex.sourceURL = this.parseAttribute(elem, "sourceURL");
            repIndex.range = this.parseAttribute(elem, "range");
        } else {
            repIndex = null;
        }

        return repIndex;
    }

    parseSegment (node) {
        let seg = new Segment(),
            type = node.tagName;

        //console.log("Parse segment: " + type);

        // Segment Base Information
        seg.timescale = this.parseAttribute(node, "timescale") || 1;
        seg.presentationTimeOffset = this.parseAttribute(node, "presentationTimeOffset");
        seg.timeShiftBufferDepth = this.parseAttribute(node, "timeShiftBufferDepth");
        seg.indexRange = this.parseAttribute(node, "indexRange");
        seg.indexRangeExact = this.parseAttribute(node, "indexRangeExact");
        seg.availabilityTimeOffset = this.parseAttribute(node, "availabilityTimeOffset");
        seg.availabilityTimeComplete = this.parseAttribute(node, "availabilityTimeComplete");
        seg.startNumber = this.parseAttribute(node, "startNumber");
        seg.duration = this.parseAttribute(node, "duration");
        seg.initialization = this.parseInitialization(node, "initialization");
        seg.representationIndex = this.parseRepresentationIndex(node, "representationIndex");

        // Segment Template and URL
        if (type == "SegmentTemplate" || type == "SegmentURL") {
            seg.media = this.parseAttribute(node, "media");
            seg.mediaRange = this.parseAttribute(node, "mediaRange");
            seg.index = this.parseAttribute(node, "index");
            seg.indexRange = this.parseAttribute(node, "indexRange");
            seg.initialization = this.parseAttribute(node, "initialization");
        }

        // Segment List information
        if (type == "SegmentList") {
            seg.xlinkHref = this.parseAttribute(node, "xlink:href");
            seg.xlinkActuate = this.parseAttribute(node, "xlink:actuate");
            seg.segmentUrls = this.parseChildren(node, "SegmentURL", this.parseSegment.bind(this));
        }

        return seg;
    }

    parseLocation (node) {
        return null;
    }

    parseMectrics (node) {
        return null;
    }

    parseEventStream (node) {
        return null;
    }

    parseSubset (node) {
        return null;
    }

    parseContentComponent (node) {
        let cc = new ContentComponent();

        cc.id = this.parseAttribute(node, "id");
        cc.lang = this.parseAttribute(node, "lang");
        cc.contentType = this.parseAttribute(node, "contentType");
        cc.par = this.parseAttribute(node, "accessibility");

        // TODO - parse missing elements

        return cc;
    }

    parseRepresentation (node) {
        let representation = new Representation();

        representation.id = this.parseAttribute(node, "id");
        representation.bandwidth = this.parseAttribute(node, "bandwidth");
        representation.qualityRanking = this.parseAttribute(node, "qualityRanking");
        representation.dependencyId = this.parseAttribute(node, "dependencyId");
        representation.mediaStreamStructureId = this.parseAttribute(node, "mediaStreamStructureId");
        //representation.common = this.parseCommon(node);

        // Parse common attributes
        representation = this.parseCommon(node, representation);

        // TODO
        representation.baseUrls = this.parseChildren(node, "BaseURL", this.parseBaseUrl.bind(this));
        representation.segmentList = this.parseChildren(node, "SegmentList", this.parseSegment.bind(this));
        representation.segmentTemplate = this.parseChildren(node, "SegmentTemplate", this.parseSegment.bind(this));
        representation.segmentBase = this.parseChildren(node, "SegmentBase", this.parseSegment.bind(this));

        return representation;
    }

    parseAdaptationSet (node) {
        let as = new AdaptationSet(),
            reps;

        as.xlinkHref = this.parseAttribute(node, "xlink:href");
        as.xlinkActuate = this.parseAttribute(node, "xlink:actuate");
        as.id = this.parseAttribute(node, "id");
        as.group = this.parseAttribute(node, "group");
        as.lang = this.parseAttribute(node, "lang");
        as.contentType = this.parseAttribute(node, "contentType");
        as.par = this.parseAttribute(node, "par");
        as.minBandwidth = this.parseAttribute(node, "minBandwidth");
        as.maxBandwidth = this.parseAttribute(node, "maxBandwidth");
        as.minWidth = this.parseAttribute(node, "minWidth");
        as.maxWidth = this.parseAttribute(node, "maxWidth");
        as.minHeight = this.parseAttribute(node, "minHeight");
        as.maxHeight = this.parseAttribute(node, "maxHeight");
        as.minFrameRate = this.parseAttribute(node, "minFrameRate");
        as.maxFrameRate = this.parseAttribute(node, "maxFrameRate");
        as.segmentAlignment = this.parseAttribute(node, "segmentAlignment");
        as.bitStreamSwitching = this.parseAttribute(node, "bitStreamSwitching");
        as.subsegmentAlignment = this.parseAttribute(node, "subsegmentAlignment");
        as.subsegmentStartsWithSAP = this.parseAttribute(node, "subsegmentStartsWithSAP");

        // Parse common attributes
        as = this.parseCommon(node, as);

        as.contentComponents = this.parseChildren(node, "ContentComponent", this.parseContentComponent.bind(this));
        as.baseUrls = this.parseChildren(node, "BaseURL", this.parseBaseUrl.bind(this));
        as.segmentList = this.parseChildren(node, "SegmentList", this.parseSegment.bind(this));
        as.segmentTemplate = this.parseChildren(node, "SegmentTemplate", this.parseSegment.bind(this));
        as.segmentBase = this.parseChildren(node, "SegmentBase", this.parseSegment.bind(this));
        as.representations = this.parseChildren(node, "Representation", this.parseRepresentation.bind(this));

        // TODO - parse missing elements

        // add parent to representations
        as.representations = this.addParsedChildrensParent(as.representations, as);

        return as;
    }

    parsePeriod (node) {
        let period = new Period();

        // parse attributes
        period.xlinkHref = this.parseAttribute(node, "xlink:href");
        period.xlinkActuate = this.parseAttribute(node, "xlink:actuate") || "onRequest";
        period.id = this.parseAttribute(node, "id");
        period.start = this.parseAttribute(node, "start");
        period.duration = this.parseAttribute(node, "duration");
        period.bitStreamSwitching = this.parseAttribute(node, "bitStreamSwitching");

        // parse child elements
        period.baseUrls = this.parseChildren(node, "BaseUrl", this.parseBaseUrl.bind(this));
        period.eventStreams = this.parseChildren(node, "EventStream", this.parseEventStream.bind(this));
        period.adaptationSets = this.parseChildren(node, "AdaptationSet", this.parseAdaptationSet.bind(this));
        period.subsets = this.parseChildren(node, "Subset", this.parseSubset.bind(this));

        // TODO - parse segment{Base,List,Template}
        //this.segmentBase = this.parseSegmentBase(node);
        period.segmentList = this.parseChildren(node, "SegmentList", this.parseSegment.bind(this));
        period.segmentTemplate = this.parseChildren(node, "SegmentTemplate", this.parseSegment.bind(this));

        // Add parent to adaptation sets
        period.adaptationSets = this.addParsedChildrensParent(period.adaptationSets, period);

        return period;
    }

    parseMPD (node) {
        let mpd = new MPD();

        // Parse attributes
        mpd.id = this.parseAttribute(node, "id");
        mpd.profiles = this.parseAttribute(node, "profiles");
        mpd.type = this.parseAttribute(node, "type") || "static";
        mpd.availabilityStartTime = this.parseAttribute(node, "availabilityStartTime");
        mpd.publishTime = this.parseAttribute(node, "publishTime");
        mpd.availabilityEndTime = this.parseAttribute(node, "availabilityEndTime");
        mpd.mediaPresentationDuration = this.parseAttribute(node, "mediaPresentationDuration");
        mpd.minimumUpdatePeriod = this.parseAttribute(node, "minimumUpdatePeriod");
        mpd.minBufferTime = this.parseAttribute(node, "minBufferTime");
        mpd.timeShiftBufferDepth = this.parseAttribute(node, "timeShiftBufferDepth");
        mpd.suggestedPresentationDelay = this.parseAttribute(node, "suggestedPresentationDelay");
        mpd.maxSegmentDuration = this.parseAttribute(node, "maxSegmentDuration");
        mpd.maxSubSegmentDuration = this.parseAttribute(node, "maxSubSegmentDuration");

        // parse child elements
        mpd.baseUrls = this.parseChildren(node, "BaseURL", this.parseBaseUrl.bind(this));
        mpd.locations = this.parseChildren(node, "Location", this.parseLocation.bind(this));
        mpd.periods = this.parseChildren(node, "Period", this.parsePeriod.bind(this));
        mpd.metrics = this.parseChildren(node, "Mectrics", this.parseMectrics.bind(this));

        // Add parent to periods
        mpd.periods = this.addParsedChildrensParent(mpd.periods, mpd);

        return mpd;
    }

    parse (mpd) {
        let parser = new DOMParser(),
            xml = parser.parseFromString(mpd, "text/xml"),
            start = new Date(),
            end,
            mpdNode,
            mpdObj;

        if (!xml) {
            console.error("Failed to parse Manifest file");
            return null;
        }

        console.log("Parsing MPD...");

        mpdNode = xml.getElementsByTagName("MPD")[0];
        mpdObj = this.parseMPD(mpdNode);

        end = new Date();
        console.log("Parsing complete. Total duration: " + (end.getTime() - start.getTime()) + " ms.");

        return mpdObj;
    }

}

export default DashParser;
