class SegmentBase {
    constructor () {
        this.timescale = null;
        this.presentationTimeOffset = null;
        this.timeShiftBufferDepth = null;
        this.indexRange = null;
        this.indexRangeExact = false;
        this.availabilityTimeOffset = null;
        this.availabilityTimeComplete = null;
        this.initialization = null;
        this.representationIndex = null;
    }
}

export default SegmentBase;
