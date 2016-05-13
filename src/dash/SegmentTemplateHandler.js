import DashDriver from "./DashDriver.js";
import Request from "../media/objects/Request.js";

class SegmentTemplateHandler {

    constructor (mediaType) {
        this.mediaType = mediaType;
        this.mediaTemplate = "";
        this.initMediaTemplate = "";
        this.index = NaN;
    }

    setup () {
        let as = DashDriver.getAdaptationSetForType(this.mediaType);

        this.initMediaTemplate = as.segmentTemplate[0].initialization;
        this.mediaTemplate = as.segmentTemplate[0].media;
        this.index = parseInt(as.segmentTemplate[0].startNumber) || 1;
    }

    _resolveUrlTemplate (template, representation) {
        template = template.split('RepresentationID').join(representation.id);
        template = template.split('Number').join(this.index);
        template = template.split('$').join('');

        return template;
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
        let url = DashDriver.getBaseUrl() + this.initMediaTemplate;

        url = this._resolveUrlTemplate(url, representation);

        return this._buildSegmentRequest(representation, url, true);

    }

    getNextRequest (representation) {
        let url = DashDriver.getBaseUrl() + this.mediaTemplate;

        url = this._resolveUrlTemplate(url, representation);

        this.index++;

        return this._buildSegmentRequest(representation, url, false);
    }

    getRequestForTime (representation, time) {

    }

}

export default SegmentTemplateHandler;