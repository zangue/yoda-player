import EventBus from "../lib/EventBus.js";
import Events from "../media/Events.js";
import XHR from "./net/XHR.js";
import Request from "./objects/Request.js";

class ManifestLoader {

    constructor () {
        this._manifest = null;
    }

    load (url) {
        let xhr,
            request,
            callbacks = {};

        callbacks.onload = function (xhr) {
            if (xhr.status >= 200 && xhr.status <= 299) {
                console.log("Manifest Loaded success");
                this._manifest = xhr.responseText;
                EventBus.broadcast(
                    Events.MANIFEST_LOADED, {
                        manifest: this._manifest
                    }
                );
            }
        };

        callbacks.onerror = function (xhr) {
            console.log("Error");
            EventBus.broadcast(
                Events.MANIFEST_LOADED, {
                    manifest: null
                }
            );
        };

        console.log("Loading manifest...");

        request = new Request();
        xhr = new XHR();

        request.method = "GET";
        request.mediaType = "text";
        request.url = url;
        request.async = true;
        request.responseType = "text";


        try {
            xhr.load(request, callbacks);
        } catch (e) {
            console.log("Something went wrong during http request: " + e.message);
        }

    }

    getManifest () {
        return this._manifest;
    }

}

export default ManifestLoader;
