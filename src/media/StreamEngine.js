import FragmentLoader from "./http/FragmentLoader.js";
import ABRManager from "./manager/ABRManager.js";
import BufferManager from "./manager/BufferManager.js";
import MetricsManager from "./manager/MetricsManager.js";
import DashDriver from "../dash/DashDriver.js";
import IndexHandlerFactory from "../dash/IndexHandlerFactory.js";
import BufferLevel from "./objects/metrics/BufferLevel.js";
import EventBus from "../lib/EventBus.js";
import Events from "./Events.js";

class StreamEngine {
    constructor (mediaType, bufferManager, videoTag) {
        this.mediaType = mediaType;
        this.bufferManager = bufferManager;
        this.videoTag = videoTag;
        this.indexHandler = IndexHandlerFactory.create(this.mediaType);
        this.fragmentLoader = new FragmentLoader();
        this.mediaInfo = DashDriver.getMediaInfoFor(this.mediaType);
        this.playbackStarted = false;
        this.abrManager = new ABRManager(mediaType);
        this.hasStarted = false;
        this.isIdle = false;
        this.isSeeking = false;
        this.scheduleWhilePaused = true;
        this.lastLoadedRepresentation = null;
    }

    // subscribe event on fragment loaded
    setup () {
        console.log("Stream Engine setup for " + this.mediaType);
        this.indexHandler.setup();
        this.abrManager.setup();

        MetricsManager.setCurrentRepresentation(this.mediaType, null);

        EventBus.subscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        EventBus.subscribe(Events.PLAYBACK_PAUSED, this.onPlaybackPaused, this);
        EventBus.subscribe(Events.PLAYBACK_PLAY, this.onPlaybackPlay, this);
        EventBus.subscribe(Events.PLAYBACK_SEEKING, this.onPlaybackSeeking, this);
        EventBus.subscribe(Events.PLAYBACK_SEEKED, this.onPlaybackSeeked, this);
        EventBus.subscribe(Events.PLAYBACK_STALLED, this.onPlaybackStalled, this);
        EventBus.subscribe(Events.PLAYBACK_ENDED, this.onPlaybackEnded, this);
        EventBus.subscribe(Events.PLAYBACK_CANPLAYTHROUGH, this.onPlaybackCanPlayThrough, this);
        EventBus.subscribe(Events.INIT_REQUESTED, this.onInitRequested, this);
        EventBus.subscribe(Events.PLAYBACK_PROGRESS, this.onPlaybackProgress, this);
        EventBus.subscribe(Events.SOURCE_BUFFER_UPDATED, this.onSourceBufferUpdated, this);
    }

    start () {
        console.log("Stream Engine starting for " + this.mediaType);
        this.hasStarted = true;
        this.scheduleNext();
    }

    stop () {
        console.trace();
        console.log("Stream Engine stopping for " + this.mediaType);
        this.hasStarted = false;
    }

    onInitRequested (e) {
        let initRequest, initRep;

        if (e.mediaType !== this.mediaType)
            return;

        initRep =  DashDriver.getRepresentationForBitrate(this.mediaType, e.bitrate);

        initRequest = this.indexHandler.getInitRequest(initRep);
        this.fragmentLoader.load(initRequest);
    }

    scheduleNext () {
        let nextRep;
        let nextRequest, isInitRequired;
        let isPaused = this.videoTag.isPaused();

        console.dir(this.mediaInfo);

        this.isIdle = !this.bufferManager.shouldBufferMore();

        if (this.isIdle || this.fragmentLoader.isLoading || !this.hasStarted ||
            isPaused && !this.scheduleWhilePaused)
             return;

        nextRep = this.abrManager.getNextRepresentation(this.mediaInfo);
   
        nextRequest = this.indexHandler.getNextRequest(nextRep);

        if (!nextRequest)
            return;

        console.dir(nextRequest);
        MetricsManager.setCurrentRepresentation(this.mediaType, nextRep);
        this.fragmentLoader.load(nextRequest);

    }

    // TODO - Move this op to buffer manager
    updateBufferLevelMetrics () {
        let bl, level;

        bl = new BufferLevel();
        level = this.bufferManager.bufferLevel;

        bl.type = this.mediaType;
        bl.t = new Date();
        bl.levelMilli = level * 1000;

        MetricsManager.addBufferLevel(bl);
    }

    onFragmentLoaded (data) {
        if (!data.fragment)
            return;

        if (data.fragment.mediaType !== this.mediaType)
            return;

        console.log("on Fragment Loaded! (" + this.mediaType + ")");
        //console.dir(data);

        console.log(this.videoTag.isPaused());

        // FIXME
        if (data.fragment.isInit)
            this.bufferManager.cacheInit(data.fragment);
        else {
            this.bufferManager.feedBuffer(data.fragment);
            this.lastLoadedRepresentation = DashDriver.getRepresentationForBitrate(this.mediaType, data.fragment.bitrate);

            if (!this.playbackStarted) {
                if (this.bufferManager.canStartPlayback()) {
                    this.bufferManager.setup();
                    this.playbackStarted = true;
                }
            }
        }

        this.scheduleNext();
    }

    onPlaybackPaused (data) {
        if (!this.fragmentLoader.isLoading && !this.scheduleWhilePaused)
            this.scheduleNext();
    }

    onPlaybackPlay (data) {
        console.log("[StreamEngine] [" + this.mediaType + "] " + "On play");
        if (this.hasStarted === false) {
            this.start();
            return;
        }
    }

    onPlaybackSeeking (data) {
        let seekTarget = data.time;

        this.isSeeking = true;

        if (this.fragmentLoader.isLoading)
            this.fragmentLoader.abort();

        this.updateBufferLevelMetrics();
        this.indexHandler.handleSeek(seekTarget);

        // TODO - Check if seek time is contained into buffered range prior making
        // decision to abort()
        this.bufferManager.abort();

        if (this.isIdle) {
            this.isIdle = false;
        }

        this.scheduleNext();
    }

    onPlaybackSeeked (data) {
        console.log("Playback rate!!!!!!!!!!!!!!!!!");
        console.log(this.videoTag.getElement().playbackRate);
    }

    onPlaybackStalled (data) {
        console.log("[StreamEngine] [" + this.mediaType + "] " + "On stalled");
        if (this.hasStarted === false)
            return;
    }

    onPlaybackEnded (data) {
        console.log("[StreamEngine] [" + this.mediaType + "] " + "On playback ended");
        this.stop();
    }

    onPlaybackCanPlayThrough (data) {
        console.log("[StreamEngine] [" + this.mediaType + "] " + "On playback can play through");
        //this.stop();
    }

    onPlaybackProgress (e) {
        this.updateBufferLevelMetrics();

        if (this.isIdle) {
            this.scheduleNext();
        }
    }

    onSourceBufferUpdated (e) {
        if (this.mediaType !== e.mediaType) return;

        if (this.isSeeking) {
            console.log("YEEEEEEEEEEEEEEEEEAAAAAAAAAAAAAAAAAAAAHHHHHHHHH");
            this.videoTag.play();
            this.isSeeking = false;
        }
    }

    reset () {
        EventBus.unsubscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        EventBus.unsubscribe(Events.PLAYBACK_PAUSED, this.onPlaybackPaused, this);
        EventBus.unsubscribe(Events.PLAYBACK_PLAY, this.onPlaybackPlay, this);
        EventBus.unsubscribe(Events.PLAYBACK_SEEKING, this.onPlaybackSeeking, this);
        EventBus.unsubscribe(Events.PLAYBACK_SEEKED, this.onPlaybackSeeked, this);
        EventBus.unsubscribe(Events.PLAYBACK_STALLED, this.onPlaybackStalled, this);
        EventBus.unsubscribe(Events.PLAYBACK_ENDED, this.onPlaybackEnded, this);
        EventBus.unsubscribe(Events.PLAYBACK_CANPLAYTHROUGH, this.onPlaybackCanPlayThrough, this);
        EventBus.unsubscribe(Events.INIT_REQUESTED, this.onInitRequested, this);
        EventBus.unsubscribe(Events.PLAYBACK_PROGRESS, this.onPlaybackProgress, this);
        EventBus.unsubscribe(Events.SOURCE_BUFFER_UPDATED, this.onSourceBufferUpdated, this);

        this.playbackStarted = false;
        this.hasStarted = false;
        this.lastLoadedRepresentation = null;
        this.isIdle = false;
        this.indexHandler.reset();

        this.setup();
    }
}

export default StreamEngine;
