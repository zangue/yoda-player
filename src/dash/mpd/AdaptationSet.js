class AdaptationSet {
    constructor () {
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
        this.Accessibility = [];
        this.role = [];
        this.rating = [];
        this.viewpoint = [];
        this.contentComponent = [];
        this.baseUrl = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
        this.representation = [];
    }
}

export default AdaptationSet;
