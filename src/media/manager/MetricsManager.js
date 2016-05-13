import HTTPRequest from "../objects/metrics/HTTPRequest.js";
import TCPConnection from "../objects/metrics/TCPConnection.js";

class MetricsManager {

    constructor () {
        this._TCPList = [];
        this._HTTPList = [];
    }

    addHTTPRequest (http) {
        console.log("[MetricsManager] addHTTPRequest()");
        //console.dir(http);
        if (!(http instanceof HTTPRequest)) {
            console.log("[MetricsManager] arg is not and HTTPRequest object. Skip adding");
            return;
        }

        this._HTTPList.push(http);
    }

    getHTTPList () {
        console.log("[metricsManager] getHTTPList()");
        //console.dir(this._HTTPList);
        return this._HTTPList;
    }
}

let metricsManager = new MetricsManager();
export default metricsManager;
