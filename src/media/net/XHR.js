import MetricsManager from "../manager/MetricsManager.js";
import Events from "../Events.js";
import EventBus from "../../lib/EventBus.js";
import HTTPRequest from "../objects/metrics/HTTPRequest.js";
import ThroughputTrace from "../objects/metrics/ThroughputTrace.js";

class XHR {

    load (request, callbacks) {
        let xhr = new XMLHttpRequest(),
            i = 0,
            isFistProgress = true,
            requestStartDate = null,
            firstByteDate = null,
            lastTraceDate = null,
            lastLoadedCount = 0,
            interval = 0,
            traces = [],
            addMetrics,
            onloadstart,
            onprogress,
            onabort,
            onerror,
            onload,
            ontimeout,
            onloadend;

        if (!callbacks.onload) {
            throw "At least xhr onload callback should be passed to loader.";
        }

        addMetrics = function () {
            let now = new Date(),
                http = new HTTPRequest(),
                requestEndDate = now,
                headers = xhr.getAllResponseHeaders(),
                latency;

            firstByteDate = firstByteDate || requestStartDate;

            latency = firstByteDate.getTime() - requestStartDate.getTime();

            http.type = request.mediaType;
            http.url = request.url;
            http.actualUrl = request.url;
            http.range = request.range;
            http.trequest = requestStartDate;
            http.tresponse = requestEndDate;
            http.tresponseCode = xhr.status;
            http.interval = interval;
            http.traces = traces;
            http.headers = headers;
            http.latency = latency;

            MetricsManager.addHTTPRequest(http);
        };

        onloadstart = function () {
            //console.log(++i + " XHR: onloadstart");
            requestStartDate = lastTraceDate = new Date();

            if (callbacks.onloadstart) {
                callbacks.onloadstart();
            }
        };

        onprogress = function (event) {
            //console.log(++i + " XHR: onprogress");
            let now = new Date(),
                trace = new ThroughputTrace();

            if (isFistProgress) {
                isFistProgress = false;
                firstByteDate = now;
            }

            trace.start = lastTraceDate;
            trace.duration = now.getTime() - lastTraceDate.getTime();
            trace.bytes = [event.loaded ? event.loaded - lastLoadedCount : 0];

            traces.push(trace);

            interval += trace.duration;
            lastTraceDate = now;
            lastLoadedCount = event.loaded;

            if (callbacks.onprogress) {
                callbacks.onprogress(xhr);
            }
        };

        onabort = function () {
            //console.log(++i + " XHR: onabort");
            if (callbacks.onabort) {
                callbacks.onabort(xhr);
            }
        };

        onerror = function () {
            //console.log(++i + " XHR: Failed");
            addMetrics();

            if (callbacks.onerror) {
                callbacks.onerror(xhr);
            }
        };

        onload = function () {
            //console.log(++i + " XHR: Loaded");
            addMetrics();

            callbacks.onload(xhr);
        };

        ontimeout = function () {
            //console.log(++i + " XHR: ontimeout");
            if (callbacks.ontimeout) {
                callbacks.ontimeout(xhr);
            }
        };

        onloadend = function () {
            //console.log(++i + " XHR: onloadend");
            if (callbacks.onloadend) {
                callbacks.onloadend(xhr);
            }
        };

        try {
            xhr.onloadstart = onloadstart.bind(this);
            xhr.onprogress = onprogress.bind(this);
            xhr.onabort = onabort.bind(this);
            xhr.onloadend = onloadend.bind(this);
            xhr.ontimeout = ontimeout.bind(this);
            xhr.onload = onload.bind(this);
            xhr.onerror = onerror.bind(this);

            //console.log(++i + " XHR LOAD: method: " + request.method + " url: " + request.url + " async: " + request.async + " responseType: " + request.responseType);

            xhr.open(request.method, request.url, request.async);
            xhr.responseType = this.responseType;

            xhr.send();
        } catch (e) {
            console.log("XHR: Something went wrong");
            xhr.onerror();
            throw e.message;
        }
    }
}

export default XHR;
