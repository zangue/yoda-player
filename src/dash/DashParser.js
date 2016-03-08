import MPD from "./mpd/MPD.js";
import Period from "./mpd/Period.js";
import AdaptationSet from "./mpd/AdaptationSet.js";
import Representation from "./mpd/Representation.js";
import MpdCommon from "./mpd/MpdCommon.js"; // common attributes and elements
import BaseUrl from "./mpd/BaseUrl.js";

class DashParser {

    /**
     * Notes:
     * - parse simple children first (e.g Representation -> segmentTemplate/ segmentList)
     * - then parse hierarchical children
     * - use tag name to differentiate
     */

    parseAttribute (node, attr) {
        return node.getAttribute(attr);
    }

    parseChildren (node, childrenTagName, parserCallback, context) {
        let children = node.children,
            parsedChildren = [],
            i;

        for (i = 0; i < children.length; i++) {
            if (children[i].tagName == childrenTagName) {
                console.dir(children[i]);
                console.dir(context);
                let parsedChild = parserCallback(children[i]).bind(context);
                parsedChildren.push(parsedChild);
            }
        }

        return parsedChildren;
    }

    parseCommon(node) {
        let common = new MpdCommon();

        common.profiles = this.parseAttribute(node, "profiles");
        common.width = this.parseAttribute(node, "width");
        common.height = this.parseAttribute(node, "height");
        common.sar = this.parseAttribute(node, "sar");
        common.frameRate = this.parseAttribute(node, "frameRate");
        common.audioSamplingRate = this.parseAttribute(node, "audioSamplingRate");
        common.mimeType = this.parseAttribute(node, "mimeType");
        common.segmentProfiles = this.parseAttribute(node, "segmentProfiles");
        common.codecs = this.parseAttribute(node, "codecs");
        common.maximumSAPPeriod = this.parseAttribute(node, "maximumSAPPeriod");
        common.startWithSAP = this.parseAttribute(node, "startWithSAP");
        common.maxPlayoutRate = this.parseAttribute(node, "maxPlayoutRate");
        common.codingDependency  = this.parseAttribute(node, "codingDependency");
        common.scanType = this.parseAttribute(node, "scanType");

        return common;
    }

    parseBaseUrl (node) {
        let baseUrl = new BaseUrl();

        baseUrl.serviceLocation = this.parseAttribute(node, "serviceLocation");
        baseUrl.byteRange = this.parseAttribute(node, "byteRange");
        baseUrl.availabilityTimeOffset = this.parseAttribute(node, "availabilityTimeOffset");
        baseUrl.availabilityTimeComplete = this.parseAttribute(node, "availabilityTimeComplete");

        return baseUrl;
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

        this.id = this.parseAttribute(node, "id");
        this.lang = this.parseAttribute(node, "lang");
        this.contentType = this.parseAttribute(node, "contentType");
        this.par = this.parseAttribute(node, "accessibility");

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
        representation.common = this.parseCommon(node);

        return representation;
    }

    parseAdaptationSet (node) {
        let as = new AdaptationSet(),
            reps;

        as.xlinkHref = this.parseAttribute(node, "xlink:href");
        as.xlinkActuate = this.parseAttribute(node, "xlink:actuate");
        as.id = this.parseAttribute(node, "id");
        as.group = this.parseAttribute(node, "group");
        as.common = this.parseCommon(node);
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

        as.contentComponents = this.parseChildren(node, "ContentComponent", this.parseContentComponent, this);
        as.representations = this.parseChildren(node, "Representation", this.parseRepresentation, this);

        // TODO - parse missing elements

        return as;
    }

    parsePeriod (node) {
        let period = new Period();

        console.log("parse period:");
        console.dir(this);

        // parse attributes
        period.xlinkHref = this.parseAttribute(node, "xlink:href");
        period.xlinkActuate = this.parseAttribute(node, "xlink:actuate") || "onRequest";
        period.id = this.parseAttribute(node, "id");
        period.start = this.parseAttribute(node, "start");
        period.duration = this.parseAttribute(node, "duration");
        period.bitStreamSwitching = this.parseAttribute(node, "bitStreamSwitching");

        // parse child elements
        period.baseUrls = this.parseChildren(node, "BaseUrl", this.parseBaseUrl, this);
        perios.eventStreams = this.parseChildren(node, "EventStream", this.parseEventStream, this);
        period.adaptationSets = this.parseChildren(node, "AdaptationSet", this.parseAdaptationSet, this);
        period.subsets = this.parseChildren(node, "Subset", this.parseSubset, this);

        // TODO - parse segment{Base,List,Template}

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
        //mpd.baseUrls = this.parseChildren(node, "BaseUrl", this.parseBaseUrl);
        //mpd.locations = this.parseChildren(node, "Location", this.parseLocation);
        mpd.periods = this.parseChildren(node, "Period", this.parsePeriod, this);
        //mpd.metrics = this.parseChildren(node, "Mectrics", this.parseMectrics);

        console.dir(mpd);

        return mpd;
    }

    parse (mpd) {
        let parser = new DOMParser(),
            xml = parser.parseFromString(mpd, "text/xml"),
            mpdNode,
            mpdObj;

        if (!xml) {
            console.error("Failed to parse Manifest file");
            return null;
        }

        console.log("Parsing MPD...");

        mpdNode = xml.getElementsByTagName("MPD")[0];
        mpdObj = this.parseMPD(mpdNode);

        return mpdObj;
    }

}

export default DashParser;
