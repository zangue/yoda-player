import EventBus from "../../lib/EventBus.js";
import Events from "../Events.js";
import MetricsManager from "../manager/MetricsManager.js";

const SAMPLE_AMOUNT = 2;
const DEFAULT_ESTIMATE = 5e5; //500kbps

class SimpleBandwidthEstimator {

    constructor () {
        this._initBandwidth = null; // bps
    }

    setup () {
        this.calcInitBandwith();
    }

    calcInitBandwith () {
        console.log("LOOOOLLLL");
        let httpList = MetricsManager.getHTTPList(); // only manifest request

        this._initBandwidth = this.getAverageThroughput(httpList, 1) || DEFAULT_ESTIMATE;

        console.log("[SimpleBandwidthEstimator] on manifest loaded handler. Init bandwidth is " + this._initBandwidth / 1000 + " kbps");
    }

    getAverageThroughput (httpList, samples) {
        console.log("[SimpleBandwidthEstimator] getAverageThroughput(). Sample amount: " + samples  + " List follows");
        //console.dir(httpList);
        let https = httpList.slice(-samples);
        //console.dir(https);
        let bytes = 0;
        let duration = 0;
        let bps = NaN;

        if (!https)
            return bps;

        https.forEach( http => {
            http.traces.forEach( trace  => {
                bytes += trace.bytes[0];
                duration += trace.duration / 1000; // in seconds
            });
        });

        bps = Math.floor((bytes * 8) / duration);

        console.log("===============================================================================================");
        console.log("[SimpleBandwidthEstimator] Estimated bandwidth : " + bps / 1000 + " kbps");
        console.log("===============================================================================================");

        return bps;
    }

    estimate () {
        console.log("[SimpleBandwidthEstimator] estimate()");
        let httpList = MetricsManager.getHTTPList();

        if (httpList.length < SAMPLE_AMOUNT)
            return this._initBandwidth;

        return this.getAverageThroughput(httpList, SAMPLE_AMOUNT);
    }

    reset () {
    }

}

export default SimpleBandwidthEstimator;
