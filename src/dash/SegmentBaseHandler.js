import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";

class SegmentBaseHandler {

    constructor (mediaType) {
        this.mediaType = mediaType;
        this.index = 0;
    }

    setup () {
    }

    _buildSegmentRequest (representation, url, range, init) {
        let request = new Request();

        request.mediaType = this.mediaType;
        request.url = url;
        request.range = range;
        request.bitrate = representation.bandwidth;
        request.index = this.index;
        request.responseType = 'arraybuffer';
        request.method = 'GET';
        request.async = true;
        request.init = init;

        console.log("next request: " + request.url + " range: " + request.range + " init" + init);

        return request;
    }

    getInitRequest (representation) {
        let range;
        let url;

        if (representation.segmentBase[0].initialization) {
            range = representation.segmentBase[0].initialization.range;
            url = representation.baseUrls[0].url;
        } else {
            throw "Couldn't find initialization";
        }

        url = DashDriver.getBaseUrl() + url;

        return this._buildSegmentRequest(representation, url, range, true);
    }

    getNextRequest (representation) {
        let url;
        let range, rangeStart, rangeEnd;
        let bytesInRange;
        let boundaries;
        let tmp;

        url = DashDriver.getBaseUrl() + representation.baseUrls[0].url;

        tmp = representation.segmentBase[0].indexRange;
        boundaries = tmp.split('-');
        boundaries[0] = parseInt(boundaries[0]);
        boundaries[1] = parseInt(boundaries[1]);
        bytesInRange = (boundaries[1] - boundaries[0]) + 1;

        rangeStart = (this.index * bytesInRange) + boundaries[0];
        rangeEnd = (this.index * bytesInRange) + boundaries[1];
        this.index++;
        range = String(rangeStart) + '-' + String(rangeEnd);
        console.log("Range: " + range);
        return this._buildSegmentRequest(representation, url, range, false);

    }

    getRequestForTime (representation, time) {

    }
}

export default SegmentBaseHandler;