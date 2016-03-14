class ManifestLoader {

    constructor () {
        this._manifest = null;
    }

    load (url) {
        let request = new XMLHttpRequest(),
            onload,
            onerror;

        onload = function () {
            if (request.status === 200) {
                this._manifest = request.responseText;
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

    getManifest () {
        return this._manifest;
    }

}

export default ManifestLoader;
