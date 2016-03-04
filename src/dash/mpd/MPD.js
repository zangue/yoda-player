class MPD {
    constructor () {
        this.id = null;
        this.profiles = null;
        this.type = "static";
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
        this.baseUrl = [];
        this.Location = [];
        this.Period = [];
        this.Metrics = [];
    }
}

export default MPD;
