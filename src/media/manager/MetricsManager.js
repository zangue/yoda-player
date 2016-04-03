import HTTPRequest from "../objects/metrics/HTTPRequest.js";
import TCPConnection from "../objects/metrics/TCPConnection.js";

class MetricsManager {

    constructor () {
        this._TCPList = [];
        this._HTTPList = [];
    }

    addHTTPRequest (http) {
        if (!(http instanceof HTTPRequest))
            return;

        this._HTTPList.push(http);
    }
}

let metricsManager = new MetricsManager();
export default metricsManager;
