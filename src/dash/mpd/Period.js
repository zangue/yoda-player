class Period {
    constructor () {
        this.xlinkHref = null;
        this.xlinkActuate = null;
        this.id = null;
        this.start = null;
        this.duration = null;
        this.bitStreamSwitching = false;
        this.baseUrls = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
        this.assetIdentifier = null;
        this.eventStreams = [];
        this.adaptationSets = [];
        this.subsets = [];
    }
}

export default Period;
