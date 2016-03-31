import EventBus from "../lib/EventBus.js";
import Events from "../media/Events.js";

class ManifestLoader {

    constructor () {
        this._manifest = null;
    }

    load (url) {
        let request = new XMLHttpRequest(),
            onload,
            onerror;

        onload = function () {
            if (request.status >= 200 && request.status <= 299) {
                console.log("Manifest Loaded success");
                this._manifest = request.responseText;
                EventBus.broadcast(
                    Events.MANIFEST_LOADED, {
                        manifest: this._manifest
                    }
                );
            }
        };

        onerror = function () {
            console.log("Error");
            EventBus.broadcast(
                Events.MANIFEST_LOADED, {
                    manifest: null
                }
            );
        };

        console.log("Loading manifest...");

        try {
            request.onload = onload.bind(this);
            request.onerror = onerror.bind(this);

            request.open("GET", url, true);
            request.responseType = "text";
            request.send();
        } catch (e) {
            request.onerror();
        }

    }

    getManifest () {
        return this._manifest;
    }

}

export default ManifestLoader;
