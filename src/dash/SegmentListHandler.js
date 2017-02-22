import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";
import IndexHandler from "./IndexHandler.js";

class SegmentListHandler extends IndexHandler {

    constructor (mediaType) {
        super(mediaType);
    }

    setup () {
        super.setup();
        this.index = this.startIndex = 0;
    }

    _buildSegmentRequest (representation, url, isInit) {
        let request = new Request();

        request.mediaType = this.mediaType;
        request.url = url;
        request.bitrate = representation.bandwidth;
        request.index = this.index;
        request.responseType = 'arraybuffer';
        request.method = 'GET';
        request.async = true;
        request.isInit = isInit;

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
        let url, request;

        if ((urlList.length < this.index) || (this.lastLoadedIndex === this.index)) {
            request = null;
        } else {
            url = DashDriver.getBaseUrl() + urlList[this.index];
            request = this._buildSegmentRequest(representation, url, false);
        }

        return request;
    }

    getRequestForTime (representation, time) {

    }

}

export default SegmentListHandler;