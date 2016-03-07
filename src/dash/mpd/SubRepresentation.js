class SubRepresentation {
    constructor () {
        this.level = null;
        this.dependencyLevel = null;
        this.bandwidth = null; // shall be present if @level is present
        this.contentComponent = null;
        this.common = null;
    }
}

export default SubRepresentation;
