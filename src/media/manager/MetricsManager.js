import HTTPRequest from "../objects/metrics/HTTPRequest.js";
import TCPConnection from "../objects/metrics/TCPConnection.js";

class MetricsManager {

    constructor () {
        this._TCPList = [];
        this._HTTPList = [];
    }

    addHTTPRequest (tcpId, type, url, actualUrl, range, trequest, tresponse, tresponseCode, interval, traces, headers, latency) {
        let http = new HTTPrequest();

        http.tcpId = tcpId;
        http.type = type;
        http.url = url;
        http.actualUrl = actualUrl;
        http.range = range;
        http.trequest = trequest;
        http.tresponse = tresponse;
        http.tresponseCode = tresponseCode;
        http.interval = interval ? interval : 0;
        http.traces = traces;
        http.headers = headers;
        http.latency = latency;

        this._HTTPList.push(http);

        return http;
    }

}

export default MetricsManager;
