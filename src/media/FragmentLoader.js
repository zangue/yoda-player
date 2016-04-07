import Fragment from "./objects/Fragment.js";
import EventBus from "../lib/EventBus.js";
import Events from "../media/Events.js";
import XHR from "./net/XHR.js";

// TODO
class FragmentLoader {

    constructor () {
    }

    load (request) {
        let xhr,
            callbacks = {};

        callbacks.onload = function (xhr) {
            if (xhr.status >= 200 && xhr.status <= 299) {
                console.log("Fragment Loaded success");
                //console.dir(xhr);
                let fragment = new Fragment();

                fragment.mediaType = request.mediaType;
                fragment.dataChunk = xhr.response;
                fragment.init = request.init;

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
            console.log("Error");
            EventBus.broadcast(
                Events.FRAGMENT_LOADED, {
                    fragment: null
                }
            );
        };

        console.log("Loading Fragment...");

        xhr = new XHR();

        try {
            xhr.load(request, callbacks);
        } catch (e) {
            console.log("[FragmentLoader] Something went wrong during http request: " + e.message);
        }
    }

}

export default FragmentLoader;
