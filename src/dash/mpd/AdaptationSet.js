import MpdCommon from "./MpdCommon.js";

class AdaptationSet extends MpdCommon {
    constructor () {
        super();
        this.xlinkHref = null;
        this.xlinkActuate = null;
        this.id = null;
        this.group = null;
        this.lang = null;
        this.contentType = null;
        this.par = null;
        this.minBandwidth = null;
        this.maxBandwidth = null;
        this.minWidth = null;
        this.maxWidth = null;
        this.minHeight = null;
        this.maxHeight = null;
        this.minFrameRate = null;
        this.maxFrameRate = null;
        this.segmentAlignment = false;
        this.bitStreamSwitching = null;
        this.subsegmentAlignment = false;
        this.subsegmentStartsWithSAP = 0;
        this.accessibilities = [];
        this.roles = [];
        this.ratings = [];
        this.viewpoints = [];
        this.contentComponents = [];
        this.baseUrls = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
        this.representations = [];
    }
}

export default AdaptationSet;
