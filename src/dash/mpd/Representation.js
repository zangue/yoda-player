class Representation {
    constructor () {
        this.id = null;
        this.bandwidth = null;
        this.qualityRanking = null;
        this.dependencyId = null;
        this.mediaStreamStructureId = null;
        this.baseUrl = [];
        this.subRepresentation = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
    }
}

export default Representation;
