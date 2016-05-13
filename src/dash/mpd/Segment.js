class Segment {
    constructor () {
        // Segment Base
        this.timescale = null;
        this.presentationTimeOffset = null;
        this.timeShiftBufferDepth = null;
        this.indexRange = null;
        this.indexRangeExact = false;
        this.availabilityTimeOffset = null;
        this.availabilityTimeComplete = null;
        this.initialization = null;
        this.representationIndex = null;
        this.duration = null;
        this.startNumber = null;
        // Segment Template
        this.media = null;
        this.index = null;
        this.initialization = null;
        this.bitstreamSwitching = null;
        // Segment List
        this.xlinkHref = null;
        this.xlinkActuate = "onRequest";
        this.segmentUrls = [];
    }
}

export default Segment;
