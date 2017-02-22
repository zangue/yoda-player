import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";
import IndexHandler from "./IndexHandler.js";

class SegmentTemplateHandler extends IndexHandler {

    constructor (mediaType) {
        super(mediaType);
        this.mediaTemplate = "";
        this.initMediaTemplate = "";
    }

    setup () {
        let as;

        super.setup();

        as = DashDriver.getAdaptationSetForType(this.mediaType);

        this.initMediaTemplate = as.segmentTemplate[0].initialization;
        this.mediaTemplate = as.segmentTemplate[0].media;
        this.startIndex = parseInt(as.segmentTemplate[0].startNumber) || 1;
        this.index = this.startIndex;
    }

    _resolveUrlTemplate (template, representation) {
        template = template.split('RepresentationID').join(representation.id);
        template = template.split('Number').join(this.index);
        template = template.split('$').join('');

        return template;
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
        let url = DashDriver.getBaseUrl() + this.initMediaTemplate;

        url = this._resolveUrlTemplate(url, representation);

        return this._buildSegmentRequest(representation, url, true);

    }

    getNextRequest (representation) {
        let url, request;

        if (this.lastLoadedindex === this.index)
            request = null;
        else {        
            url = DashDriver.getBaseUrl() + this.mediaTemplate;
            url = this._resolveUrlTemplate(url, representation);

            request = this._buildSegmentRequest(representation, url, false);
        }

        return request;
    }

    getRequestForTime (representation, time) {

    }

    handleSeek (targetTime, mediaInfos) {
        
    }

}

export default SegmentTemplateHandler;