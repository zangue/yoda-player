import EventBus from "../../lib/EventBus.js";
import Events from "../Events.js";
import XHR from "./XHR.js";
import Request from "../objects/Request.js";

class ManifestLoader {

    constructor () {
        this._manifest = null;
        this.xhrHandler = new XHR();
    }

    load (url) {
        return new Promise((resolve, reject) => {
            let request,
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
                    resolve({manifest: this._manifest});
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            callbacks.onerror = function (xhr) {
                console.log("Error");
                EventBus.broadcast(
                    Events.MANIFEST_LOADED, {
                        manifest: null
                    }
                );
                reject(new Error("Error loading manifest ..."));
            };

            console.log("Loading manifest...");

            request = new Request();

            request.method = "GET";
            request.mediaType = "text";
            request.url = url;
            request.async = true;
            request.responseType = "text";

            try {
                this.xhrHandler.load(request, callbacks);
            } catch (e) {
                console.log("Something went wrong during http request: " + e.message);
                reject(new Error(e.message));
            }
        });
    }

    abort () {
        this.xhrHandler.abort();
    }

    getManifest () {
        return this._manifest;
    }

}

export default ManifestLoader;
