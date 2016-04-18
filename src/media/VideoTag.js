import EventBus from "../lib/EventBus.js";
import Events from "./Events.js";

/**
 * HTML5 Video Element handler
 */
class VideoTag {

    /**
     * @param video  The HTML5 video element
     */
    constructor (id) {
        this._video = document.querySelector(id);

        this._mediaEvents = {
            "play": this.onPlay,
            "pause": this.onPause,
            "seeking": this.onSeeking, // sent when the seeking operation begins
            "seeked": this.onSeeked, // sent when the seeking operation stopped
            "stalled": this.onStalled,
            "ended": this.onEnded,
            "canplaythrough": this.onCanPlayThrough
        };
    }

    setup () {
        // Set default dimensions
        this._video.width = 640;
        this._video.height = 360;

        for (let event in this._mediaEvents) {
            this._video.addEventListener(event, this._mediaEvents[event]);
        }
    }

    // Media Properties
    getElement() {
        return this._video;
    }

    setElement (video) {
        this._video = video;
    }

    setSource (source) {
        this._video.src = source;
    }

    getSource (video) {
        return this._video.src;
    }

    setPoster (poster) {
        this._video.poster = poster;
    }

    getPoster () {
        return this._video.poster;
    }

    setDuration (duration) {
        if (this._video.duration != duration)
            this._video.duration = duration;
    }

    getDuration () {
        return this._video.duration;
    }

    isPaused () {
        return this._video.paused;
    }

    getWidth () {
        return this._video.width;
    }

    setWidth (value) {
        this._video.width = value;
    }

    getHeight () {
        return this._video.height;
    }

    setHeight (value) {
        this._video.height = value;
    }

    // Media Events
    onPlay () {
        console.log("on play");
        EventBus.broadcast(
            Events.PLAYBACK_RESUMED, {
                data: null
            }
        );
    }

    onPause () {
        console.log("on pause");
        EventBus.broadcast(
            Events.PLAYBACK_PAUSED, {
                data: null
            }
        );
    }

    onSeeking () {
        console.log("on seeking");
        EventBus.broadcast(
            Events.PLAYBACK_SEEKING, {
                data: null
            }
        );
    }

    onSeeked () {
        console.log("on seeked");
        EventBus.broadcast(
            Events.PLAYBACK_SEEKED, {
                data: null
            }
        );
    }

    onStalled () {
        console.log("on stalled");
        EventBus.broadcast(
            Events.PLAYBACK_STALLED, {
                data: null
            }
        );
    }

    onEnded () {
        console.log("on ended");
        EventBus.broadcast(
            Events.PLAYBACK_ENDED, {
                data: null
            }
        );
    }

    onCanPlayThrough () {
        console.log("on canplaythrough");
        EventBus.broadcast(
            Events.PLAYBACK_CANPLAYTHROUGH, {
                data: null
            }
        );
    }
}

export default VideoTag;
