import EventBus from "../../lib/EventBus.js";
import Events from "../Events.js";
import MetricsManager from "../manager/MetricsManager.js";

const SAMPLE_AMOUNT = 2;
const DEFAULT_ESTIMATE = 5e5; //500kbps
const NETWORK_OVERHEAD_RATIO = 1.5;

class SimpleBandwidthEstimator {

    constructor () {
        this._initBandwidth = null; // bps
    }

    setup () {
        this.calcInitBandwith();
    }

    calcInitBandwith () {
        console.log("[SimpleBandwidthEstimator] calcInitBandwith()");
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
            bytes = http.traces.reduce((acc, trace) => acc + trace.bytes[0], 0);
            duration = http.traces.reduce((acc, trace) => acc + (trace.duration / 1000), 0);
        });

        bps = Math.floor((bytes * 8) / duration);

        console.log("===============================================================================================");
        console.log("[SimpleBandwidthEstimator] Estimated bandwidth : " + bps / 1000 + " kbps");
        console.log("===============================================================================================");

        return bps;
    }

    estimate (mediaInfo) {
        console.log("[SimpleBandwidthEstimator] estimate()");
        let httpList = MetricsManager.getHTTPList();
        let lastRep = MetricsManager.getLatestMetrics(mediaInfo.mediaType).representation || null;
        let bufferLevel = MetricsManager.getLatestMetrics(mediaInfo.mediaType).bufferLevel || null;
        let bps;

        if (httpList.length < SAMPLE_AMOUNT)
            return this._initBandwidth;

        bps = this.getAverageThroughput(httpList, SAMPLE_AMOUNT);

        if (null === lastRep || null === bufferLevel)
            return bps;

        let lastRepBps = parseInt(lastRep.bandwidth);

        // Try to avoid switching down the quality
        if (lastRepBps > bps) {
            let segmentDuration = mediaInfo.segmentDuration / mediaInfo.timescale;
            let optimalDownloadTimeSec = segmentDuration * NETWORK_OVERHEAD_RATIO;
            let slownessFactor = 1 - (bps / lastRepBps);
            let extraTimeSec = optimalDownloadTimeSec * slownessFactor;// TODO - add some safety factor
            let estimatedLastRepDownloadTime = optimalDownloadTimeSec + extraTimeSec;

            bufferLevel = MetricsManager.getLatestMetrics(mediaInfo.mediaType)["bufferLevel"];

            console.log("===============================================================================================");
            console.log("[SimpleBandwidthEstimator] Optimal Download Time (sec): " + optimalDownloadTimeSec);
            console.log("[SimpleBandwidthEstimator] Last rep bandwidth: " + lastRepBps / 1000 + " kbps");
            console.log("[SimpleBandwidthEstimator] Estimated bandwidth: " + bps / 1000 + " kbps");
            console.log("[SimpleBandwidthEstimator] Slowness factor: " + slownessFactor + " s");
            console.log("[SimpleBandwidthEstimator] Estimated download Time: " + estimatedLastRepDownloadTime + " s");
            console.log("[SimpleBandwidthEstimator] Buffer Level: " + bufferLevel.levelMilli / 1000 + " s");
            console.log("===============================================================================================");

            if ((bufferLevel.levelMilli/1000) >= estimatedLastRepDownloadTime) {
                console.log("===============================================================================================");
                console.log("[SimpleBandwidthEstimator] Should have enough buffer ahead to tolerate slower download");
                console.log("===============================================================================================");
                bps = lastRepBps;
            }
        }

        return bps;
    }

    reset () {
    }

}

export default SimpleBandwidthEstimator;
