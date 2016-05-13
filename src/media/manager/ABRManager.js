import DashDriver from "../../dash/DashDriver.js";
import SimpleBandwidthEstimator from "../abr/SimpleBandwidthEstimator.js";

class ABRManager {
    constructor() {
        this._bandwidthEstimator = new SimpleBandwidthEstimator();
    }

    setup () {
        console.log("[ABRManager] setting up...");
        this._bandwidthEstimator.setup();
    }

    getNextRepresentation (mediaInfo) {
        console.log("[ABRManager] getNextRepresentation()");
        let mediaType = mediaInfo.mediaType;
        let bitrate;
        let bitrates = mediaInfo.bitrates;
        let representation = null;
        let bandwidth;

        bandwidth = this._bandwidthEstimator.estimate();

        // sort in descending order
        bitrates = bitrates.sort(function (a, b) { return b - a; });

        bitrate = bitrates[bitrates.length - 1];

        if (!bandwidth) {
            representation = DashDriver.getRepresentationForBitrate(mediaType, bitrate);

        } else {
            console.log("\n######################################");
            console.log("Bitrate list:");
            //console.dir(bitrates);
            console.log("Looking for matching bitrate:");
            for (let i = 0; i < bitrates.length; i++) {
                console.log("comparing estimation: " + bandwidth.toFixed(3) + " with available bandwidth: " + bitrates[i].toFixed(3));
                if (bandwidth >= bitrates[i]) {
                    bitrate = bitrates[i];
                    console.log("Choosed bitrate: " + bitrate.toFixed(3));
                    break;
                }
            }
            console.log("######################################\n");
            representation = DashDriver.getRepresentationForBitrate(mediaType, bitrate);
        }

        console.log("[ABRManager] Next representation with mimetype: " + representation.mimeType + " bandwidth: " + representation.bandwidth + " and id: " + representation.id);
        return representation;
    }

    reset () {
        this._bandwidthEstimator.reset();
    }
}

export default ABRManager;
