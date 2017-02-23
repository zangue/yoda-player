import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";
import IndexHandler from "./IndexHandler.js";

class SegmentListHandler extends IndexHandler {

    constructor (mediaType) {
        super(mediaType);
    }

    setup () {
        super.setup();
        let as = DashDriver.getAdaptationSetForType(this.mediaType);

        this.index = this.startIndex = 0;

        if (as.segmentList[0])
            if (as.segmentList[0].duration) {
                this.segmentDuration = as.segmentList[0].duration;
                this.timescale = as.segmentList[0].timescale || 1;
            }

        // reprsentation settings override adaptation set level settings
        if (as.representations[0].segmentList[0].duration) {
            this.segmentDuration = as.representations[0].segmentList[0].duration;
            this.timescale = as.representations[0].segmentList[0].timescale || 1;
        }

        if (!this.segmentDuration)
            throw new Error("Could not find segment duration information!");
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
        else if (representation.segmentBase[0])
            url = representation.segmentBase[0].initialization.sourceURL;
        else
            throw new Error("Couldnt find initialization!");

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

    handleSeek (targetTime) {
        let segDuration = this.segmentDuration / this.timescale;

        this.index = Math.ceil(targetTime/segDuration) - this.startIndex;
    }

}

export default SegmentListHandler;