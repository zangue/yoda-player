import DashParser from './dash/DashParser.js';

class Yoda {

    constructor (manifest) {
        this._manifest = manifest;
    }

    loadManifest (url) {
        let request = new XMLHttpRequest(),
            onload,
            onerror;

        onload = function () {
            if (request.status === 200) {
                this._manifest = request.responseText;
                console.log("onload: " + this._manifest);
            }
        };

        onerror = function () {
            console.error("Could not load manifest.");
        }

        console.log("Loading manifest...");

        try {
            request.onload = onload;
            request.onerror = onerror;

            request.open("GET", url, true);
            request.responseType = "text";
            request.send();
        } catch (e) {
            request.onerror();
        }
    }

    getManifest() {
        console.log("getManifest: " + this._manifest);
        return this._manifest;
    }
}

export default Yoda;
