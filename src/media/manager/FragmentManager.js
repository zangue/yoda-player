import DashDriver from "../../dash/DashDriver.js";
import Request from "../objects/Request.js";
// make it a singleton
class FragmentManager {
    constructor () {
        // TODO - Index
        this.index = 0;
    }

    getInitRequest (mediaType, bitrate) {
        console.log("Get init request");
        let rep = DashDriver.getRepresentationForBitrate(mediaType, bitrate);
        let initUrl;
        let request;

        //console.dir(rep);

        if (rep.segmentList[0].initialization) {
            //console.log("initialization " + rep.segmentList[0].initialization.sourceURL);
            initUrl = rep.segmentList[0].initialization.sourceURL;
        } else {
            throw "No initialization found";
        }

        request = new Request();

        request.mediaType = mediaType;
        request.url = DashDriver.getBaseUrl() + initUrl;
        request.bitrate = bitrate;
        request.index = 0;
        request.responseType = "arraybuffer";
        request.method = "GET";
        request.async = true;
        request.init = true;

        return request;
    }

    getNextRequest (mediaType, bitrate) {
        let rep = DashDriver.getRepresentationForBitrate(mediaType, bitrate);
        let urlList = DashDriver.getSegments(rep);
        let request;

        //console.dir(urlList);

        if (!urlList[this.index])
            return null;

        request = new Request();

        request.mediaType = mediaType;
        request.url = DashDriver.getBaseUrl() + urlList[this.index++];
        request.bitrate = bitrate;
        request.index = this.index;
        request.responseType = 'arraybuffer';
        request.method = 'GET';
        request.async = true;
        request.init = false;

        console.log("next request: " + request.url);

        return request;
    }

    // when seeking
    getRequestForTime (mediaType, bitrate, time) {

    }
}

export default FragmentManager;
