class MpdCommon {
    constructor () {
        this.profiles = null;
        this.width = null;
        this.height = null;
        this.sar = null;
        this.frameRate = null;
        this.audioSamplingRate = null;
        this.mimeType = null;
        this.segmentProfiles = null;
        this.codecs = null;
        this.maximumSAPPeriod = null;
        this.startWithSAP = null;
        this.maxPlayoutRate = null;
        this.codingDependency = null;
        this.scanType = null;
        this.framePacking = [];
        this.audioChannelConfigurations = [];
        this.contentProtections = [];
        this.essentialProperties = [];
        this.supplementaryProperties = [];
        this.inbandEventStreams = [];
    }
}

export default MpdCommon;
