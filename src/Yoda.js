import DashParser from './dash/DashParser.js';

class Yoda {
    constructor () {
        this.manifest = null;
    }

    loadManifest (url) {
        let request = new XMLHttpRequest(),
            onload,
            onerror;

        onload = function () {
            if (request.status === 200) {
                this.manifest = request.responseText;
            }
        };

        onerror = function () {
            console.error("Could not load manifest.");
        };

        console.log("Loading manifest...");

        try {
            request.onload = onload.bind(this);
            request.onerror = onerror;

            request.open("GET", url, true);
            request.responseType = "text";
            request.send();
        } catch (e) {
            request.onerror();
        }

        console.log("Loading manifest... DONE.");
    }

    getManifest() {
        return this.manifest;
    }
}

export default Yoda;
