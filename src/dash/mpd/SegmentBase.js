class SegmentBase {
    constructor () {
        this.timescale = null;
        this.presentationTimeOffset = null;
        this.timeShiftBufferDepth = null;
        this.indexRangeExact = false;
        this.initialization = null;
        this.representationIndex = null;
    }
}

export default SegmentBase;
