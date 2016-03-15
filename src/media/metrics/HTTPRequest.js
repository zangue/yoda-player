class HTTPRequest {
    constructor () {
        this.tcpId = null;
        this.type = null;
        this.url = null;
        this.actualUrl = null;
        this.range = null;
        this.trequest = null;
        this.tresponse = null;
        this.tresponseCode = null;
        this.intervall = null;
        this.traces = [];
        this.headers = null;
    }
}

export default HTTPRequest;
