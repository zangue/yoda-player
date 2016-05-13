import FragmentLoader from "./http/FragmentLoader.js";
import ABRManager from "./manager/ABRManager.js";
import BufferManager from "./manager/BufferManager.js";
import DashDriver from "../dash/DashDriver.js";
import IndexHandlerFactory from "../dash/IndexHandlerFactory.js";
import EventBus from "../lib/EventBus.js";
import Events from "./Events.js";

class StreamEngine {
    constructor (mediaType, bufferManager, videoElement) {
        this.mediaType = mediaType;
        this.bufferManager = bufferManager;
        this.element = videoElement;
        this.indexHandler = IndexHandlerFactory.create(this.mediaType);
        this.fragmentLoader = new FragmentLoader();
        this.mediaInfo = DashDriver.getMediaInfoFor(this.mediaType);
        this.playbackStarted = false;
        this.abrManager = new ABRManager();
    }

    // subscribe event on fragment loaded
    setup () {
        console.log("Stream Engine setup for " + this.mediaType);
        this.indexHandler.setup();
        this.abrManager.setup();

        EventBus.subscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        EventBus.subscribe(Events.PLAYBACK_PAUSED, this.onPlaybackPaused, this);
        EventBus.subscribe(Events.PLAYBACK_RESUMED, this.onPlaybackResumed, this);
        EventBus.subscribe(Events.PLAYBACK_SEEKING, this.onPlaybackSeeking, this);
        EventBus.subscribe(Events.PLAYBACK_SEEKED, this.onPlaybackSeeked, this);
        EventBus.subscribe(Events.PLAYBACK_STALLED, this.onPlaybackStalled, this);
        EventBus.subscribe(Events.PLAYBACK_ENDED, this.onPlaybackEnded, this);
        EventBus.subscribe(Events.PLAYBACK_CANPLAYTHROUGH, this.onPlaybackCanPlayThrough, this);
    }

    start () {
        console.log("Stream Engine starting for " + this.mediaType);
        this.scheduleInit();
    }

    stop () {

    }

    scheduleInit () {
        let initRequest;
        let initRep;
        let bitrate;

        bitrate = this.mediaInfo.bitrates[this.mediaInfo.bitrates.length-1];
        //initRep = this.abrManager.getNextRepresentation(this.mediaInfo);
        initRep = DashDriver.getRepresentationForBitrate(this.mediaType, bitrate);
        console.log("get init request for bitrate: " + initRep.bandwidth);
        initRequest = this.indexHandler.getInitRequest(initRep);
        console.dir(initRequest);
        this.fragmentLoader.load(initRequest);
    }

    scheduleNext () {
        let nextRep;
        let nextRequest;

        nextRep = this.abrManager.getNextRepresentation(this.mediaInfo);
        nextRequest = this.indexHandler.getNextRequest(nextRep);

        // All segment has alredy been loaded
        if (!nextRequest)
            return;

        // TODO - Add event onAppend to will also cause scheduleNext to be called
        // at the moment should buffer more will just return true
        if (!this.bufferManager.shouldBuffer())
             return;

        console.dir(nextRequest);
        this.fragmentLoader.load(nextRequest);
    }

    // TODO - suscribe event
    // See if we stopped because buffer were full and
    // schedule next segments if there some place now
    onFragmentAppended (data) {
        this.scheduleNext();
    }

    onFragmentLoaded (data) {
        if (!data.fragment)
            return;

        if (data.fragment.mediaType !== this.mediaType)
            return;

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

    onPlaybackPaused (data) {

    }

    onPlaybackResumed (data) {

    }

    onPlaybackSeeking (data) {

    }

    onPlaybackSeeked (data) {

    }

    onPlaybackStalled (data) {

    }

    onPlaybackEnded (data) {

    }

    onPlaybackCanPlayThrough (data) {

    }

    reset () {
        EventBus.unsubscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        EventBus.unsubscribe(Events.PLAYBACK_PAUSED, this.onPlaybackPaused, this);
        EventBus.unsubscribe(Events.PLAYBACK_RESUMED, this.onPlaybackResumed, this);
        EventBus.unsubscribe(Events.PLAYBACK_SEEKING, this.onPlaybackSeeking, this);
        EventBus.unsubscribe(Events.PLAYBACK_SEEKED, this.onPlaybackSeeked, this);
        EventBus.unsubscribe(Events.PLAYBACK_STALLED, this.onPlaybackStalled, this);
        EventBus.unsubscribe(Events.PLAYBACK_ENDED, this.onPlaybackEnded, this);
        EventBus.unsubscribe(Events.PLAYBACK_CANPLAYTHROUGH, this.onPlaybackCanPlayThrough, this);
        this.setup();
    }
}

export default StreamEngine;
