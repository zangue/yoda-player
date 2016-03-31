import ThroughputTrace from "./metrics/ThroughputTrace.js";
import Fragment from "./objects/Fragment";

class FragmentLoader {

    constructor (metricsManager) {
        this._metricsManager = metricsManager;
    }

    load (request) {
        let xhr = new XMLHttpRequest(),
            isFistProgress = true,
            requestStartDate = null,
            firstByteDate = null,
            lastTraceDate = null,
            lastLoadedCount = 0,
            interval = 0,
            traces = [],
            addMetrics,
            onload,
            onloadstart,
            onprogress,
            onerror;

        addMetrics = function () {
            let now = new Date(),
                requestEndDate = now,
                headers = xhr.getAllResponseHeaders(),
                latency;

            latency = firstByteDate.getTime() - requestStartDate.getTime();

            this._metricsManager.addHTTPRequest(
                null, // tcpId
                request.mediaType, // type
                request.url, // url
                request.url, // actualUrl
                request.range, // range
                requestStartDate, // trequest
                requestEndDate, // tresponse
                xhr.status, // tresponseCode
                interval, // interval
                traces, // traces
                headers, // headers
                latency // latency
            );
        };

        onloadstart = function () {
            requestStartDate = lastTraceDate = new Date();
        };

        onload = function () {
            let fragment;

            if (request.status < 200 || request.status > 299) {
                return null;
            }

            fragment = new Fragment();

            fragment.mediaType = request.mediaType;
            fragment.dataChunk = new Uint8Array(request.response);

            // TODO - Fire event FRAGMENT_LOADED and loaded fragment available

            addMetrics();

            console.log("Loaded " + request.mediaType);
        };

        onprogress = function (event) {
            let now = new Date(),
                trace = new ThroughputTrace();

            if (isFistProgress) {
                isFistProgress = false;

                if (!event.lengthComputable || (event.lengthComputable && event.total !== event.loaded)) {
                    firstByteDate = now;
                }
            }

            trace.start = lastTraceDate;
            trace.duration = now.getTime() - lastTraceDate.getTime();
            trace.bytes = [event.loaded ? event.loaded - lastLoadedCount : 0];

            traces.push(trace);

            interval += trace.duration;
            lastTraceDate = now;
            lastLoadedCount = event.loaded;
        };

        onerror = function () {
            addMetrics();

            console.log("Failed " + request.mediaType);
        };

        try {
            xhr.onloadstart = onloadstart.bind(this);
            xhr.onload = onload.bind(this);
            xhr.onprogress = onprogress.bind(this);
            xhr.onerror = onerror.bind(this);

            xhr.open("GET", request.url, true);
            xhr.responseType = request.responseType;

            xhr.send();
        } catch (e) {
            console.log("Something went wrong during fragment request: " + e.message);
        }
    }

}

export default FragmentLoader;
