import MpdCommon from "./MpdCommon.js";

class Representation extends MpdCommon {
    constructor () {
        super();
        this.adaptationSet = null; // parent
        this.id = null;
        this.bandwidth = null;
        this.qualityRanking = null;
        this.dependencyId = null;
        this.mediaStreamStructureId = null;
        this.baseUrls = [];
        this.subRepresentations = [];
        this.segmentBase = null;
        this.segmentList = null;
        this.segmentTemplate = null;
    }

    setParent (parent) {
        this.adaptationSet = parent;
    }
}

export default Representation;
