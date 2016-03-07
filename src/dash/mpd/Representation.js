class Representation {
    constructor () {
        this.id = null;
        this.bandwidth = null;
        this.qualityRanking = null;
        this.dependencyId = null;
        this.mediaStreamStructureId = null;
        this.common = null;
        this.baseUrls = [];
        this.subRepresentations = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
    }
}

export default Representation;
