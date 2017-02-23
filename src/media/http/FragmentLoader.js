import Fragment from "../objects/Fragment.js";
import EventBus from "../../lib/EventBus.js";
import Events from "../Events.js";
import XHR from "./XHR.js";

// TODO
class FragmentLoader {

    constructor () {
        this.xhrHandler = new XHR();
        this.isLoading = false;
    }

    load (request) {
        let callbacks = {};
        let self = this;

        this.isLoading = true;

        callbacks.onload = function (xhr) {
            self.isLoading = false;

            if (xhr.status >= 200 && xhr.status <= 299) {
                console.log("Fragment Loaded success");
                //console.dir(xhr);
                let fragment = new Fragment();

                fragment.mediaType = request.mediaType;
                fragment.dataChunk = xhr.response;
                fragment.index = request.index;
                fragment.bitrate = request.bitrate;
                fragment.isInit = request.isInit;

                EventBus.broadcast(
                    Events.FRAGMENT_LOADED, {
                        fragment: fragment
                    }
                );
            }
        };

        callbacks.onprogress = function (xhr, trace) {
            console.log("Fragment Loading progress ...");
            EventBus.broadcast(
                Events.FRAGMENT_PROGRESS, {
                    trace: trace
                }
            );
        };

        callbacks.onerror = function (xhr) {
            self.isLoading = false;

            console.log("Error");
            EventBus.broadcast(
                Events.FRAGMENT_LOADED, {
                    fragment: null
                }
            );
        };

        console.log("Loading Fragment...");

        try {
            this.xhrHandler.load(request, callbacks);
        } catch (e) {
            console.log("[FragmentLoader] Something went wrong during http request: " + e.message);
        }
    }

    abort () {
        this.xhrHandler.abort();
    }

}

export default FragmentLoader;
