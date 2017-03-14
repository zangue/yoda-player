import HTTPRequest from "../objects/metrics/HTTPRequest.js";
import TCPConnection from "../objects/metrics/TCPConnection.js";
import BufferLevel from "../objects/metrics/BufferLevel.js";

class MetricsManager {

    constructor () {
        this._latest = {};
        this._TCPList = [];
        this._HTTPList = [];
        this._BufferLevelList = [];
    }

    getLatestMetrics (mediaType) {
        return this._latest[mediaType];
    }

    setCurrentRepresentation(mediaType, r) {
        this._latest[mediaType] = this._latest[mediaType] || {};
        this._latest[mediaType]["representation"] = r;
    }

    addHTTPRequest (http) {
        console.log("[MetricsManager] addHTTPRequest()");
        //console.dir(http);
        if (!(http instanceof HTTPRequest)) {
            console.log("[MetricsManager] arg is not and HTTPRequest object. Skip adding");
            return;
        }

        this._latest[http.type] = this._latest[http.type] || {};
        this._latest[http.type]["http"] = http;
        this._HTTPList.push(http);
    }

    getHTTPList () {
        console.log("[metricsManager] getHTTPList()");
        //console.dir(this._HTTPList);
        return this._HTTPList;
    }

    addBufferLevel (bl) {
        if (!(bl instanceof BufferLevel)) {
            console.log("[MetricsManager] arg is not and HTTPRequest object. Skip adding");
            return;
        }

        this._latest[bl.type] = this._latest[bl.type] || {};
        this._latest[bl.type]["bufferLevel"] = bl;
        this._BufferLevelList.push(bl);
    }

    getBufferLevelList () {
        return this._BufferLevelList;
    }
}

let metricsManager = new MetricsManager();
export default metricsManager;
