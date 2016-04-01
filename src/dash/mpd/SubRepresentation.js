import MpdCommon from "./MpdCommon.js";

class SubRepresentation extends MpdCommon {
    constructor () {
        super();
        this.level = null;
        this.dependencyLevel = null;
        this.bandwidth = null; // shall be present if @level is present
        this.contentComponent = null;
    }
}

export default SubRepresentation;
