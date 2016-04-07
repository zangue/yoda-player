import FragmentLoader from "./FragmentLoader.js";
import ABRManager from "./manager/ABRManager.js";
import BufferManager from "./manager/BufferManager.js";
import FragmentManager from "./manager/FragmentManager.js";
import DashDriver from "../dash/DashDriver.js";
import IndexHandler from "../dash/IndexHandler.js";
import EventBus from "../lib/EventBus.js";
import Events from "./Events.js";

class StreamEngine {
    constructor (mediaType, bufferManager) {
        this.mediaType = mediaType;
        this.bufferManager = bufferManager;
        this.fragmentManager = new FragmentManager();
        this.fragmentLoader = new FragmentLoader();
        this.mediaInfo = DashDriver.getMediaInfoFor(this.mediaType);
        this.playbackStarted = false;
        //let rep = this.dash.getRepresentationForBitrate("video", mediaInfo.bitrates[0], manifest);
        //let urlList = this.dash.getSegments(rep);
    }

    // suscribe event on fragment loaded
    setup () {
        EventBus.subscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
    }

    start () {
        let initRequest;
        console.log("Stream Engine starting for " + this.mediaType);
        // request init fragment and load it
        console.log("get init request for bitrate: " + this.mediaInfo.bitrates[0]);
        initRequest = this.fragmentManager.getInitRequest(this.mediaType, this.mediaInfo.bitrates[0]);
        //console.dir(initRequest);
        this.fragmentLoader.load(initRequest);
    }

    scheduleNext () {
        // TODO - Add event onAppend to will also cause scheduleNext to be called
        // at the moment should buffer more will just return true
        if (!this.bufferManager.shouldBuffer())
            return;

        // TODO - Ask ABRManager for available bandwidth then choose the closest bitrate to request next fragment
        let nextRequest = this.fragmentManager.getNextRequest(this.mediaType, this.mediaInfo.bitrates[0]);

        // All segment has alredy been loaded
        if (!nextRequest)
            return;

        this.fragmentLoader.load(nextRequest);

    }

    // See if we stopped because buffer were full and
    // schedule next segments if there some place now
    onFragmentAppended (data) {

    }

    onFragmentLoaded (data) {
        console.log("on Fragment Loaded!");
        //console.dir(data);

        this.bufferManager.feedBuffer(data.fragment);

        if (!this.playbackStarted) {
            if (this.bufferManager.canStartPlayback()) {
                this.bufferManager.AppendToSource(); // init request
                this.bufferManager.setup();
                this.playbackStarted = true;
            }
        }

        this.scheduleNext();
        // push data to buffer
        // request schedule of next fragment
    }

    reset () {
        EventBus.unsubscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        this.setup();
    }
}

export default StreamEngine;
