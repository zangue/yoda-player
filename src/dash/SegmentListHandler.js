import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";

class SegmentListHandler {

    constructor (mediaType) {
        this.mediaType = mediaType;
        this.index = 0;
    }

    setup () {

    }

    _buildSegmentRequest (representation, url, init) {
        let request = new Request();

        request.mediaType = this.mediaType;
        request.url = url;
        request.bitrate = representation.bandwidth;
        request.index = this.index;
        request.responseType = 'arraybuffer';
        request.method = 'GET';
        request.async = true;
        request.init = init;

        console.log("next request: " + request.url);

        return request;
    }

    getInitRequest (representation) {
        let as = DashDriver.getAdaptationSetForType(this.mediaType);
        let url = "";

        if (as.segmentList[0])
            if (as.segmentList[0].initialization)
                url = as.segmentList[0].initialization.sourceURL;

        // reprsentation settings override adaptation set level settings
        if (representation.segmentList[0].initialization)
            url = representation.segmentList[0].initialization.sourceURL;

        url = DashDriver.getBaseUrl() + url;

        return this._buildSegmentRequest(representation, url, true);
    }

    getNextRequest (representation) {
        let urlList = DashDriver.getSegments(representation);
        let url;

        if (!urlList[this.index])
            return null;

        url = DashDriver.getBaseUrl() + urlList[this.index++];

        return this._buildSegmentRequest(representation, url, false);
    }

    getRequestForTime (representation, time) {

    }

}

export default SegmentListHandler;