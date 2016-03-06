class MPD {
    constructor () {
        this.id = null;
        this.profiles = null;
        this.type = null;
        this.availabilityStartTime = null; // Must be present for @type='dynamic'
        this.publishTime = null; // Must be present for @type='dynamic'
        this.availabilityEndTime = null;
        this.mediaPresentationDuration = null;
        this.minimumUpdatePeriod = null;
        this.minBufferTime = null;
        this.timeShiftBufferDepth = null;
        this.suggestedPresentationDelay = null;
        this.maxSegmentDuration = null;
        this.maxSubSegmentDuration = null;
        this.programInformation = [];
        this.baseUrls = [];
        this.locations = [];
        this.periods = [];
        this.metrics = [];
    }
}

export default MPD;
