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
            "play": this.onPlay.bind(this),
            "pause": this.onPause.bind(this),
            "seeking": this.onSeeking.bind(this), // sent when the seeking operation begins
            "seeked": this.onSeeked.bind(this), // sent when the seeking operation stopped
            "stalled": this.onStalled.bind(this),
            "ended": this.onEnded.bind(this),
            "canplaythrough": this.onCanPlayThrough.bind(this),
            "timeupdate": this.onTimeUpdated.bind(this),
            "ratechange": this.onRateChange.bind(this)
        };

        this.lastTimeUpdateValue = NaN;
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

    play () {
        if (!this._video) return;

        this._video.play();
    }

    pause () {
        if (!this._video) return;

        this._video.pause();
    }

    seek (time) {
        if (!this._video || this._video.currentTime == time) return;

        try {
            this._video.currentTime = time;
        } catch (e) {
            console.log("Could not set seek time");
            console.log(e);
        }
    }

    // Media Events
    onPlay () {
        console.log("on play");
        EventBus.broadcast(
            Events.PLAYBACK_PLAY, {
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

    onSeeking (e) {
        console.log("on seeking");
        console.log(e);
        EventBus.broadcast(
            Events.PLAYBACK_SEEKING, {
                time: this._video.currentTime
            }
        );
    }

    onSeeked (e) {
        console.log("on seeked");
        EventBus.broadcast(
            Events.PLAYBACK_SEEKED, {
                time: this._video.currentTime
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

    onTimeUpdated (e) {
        console.log("on timeupdate");

        if (!this._video) return;

        let currentTime = this._video.currentTime;

        if (isNaN(this.lastTimeUpdateValue))
            this.lastTimeUpdateValue = currentTime;

        if (this.lastTimeUpdateValue < currentTime) {
            this.lastTimeUpdateValue = currentTime;
            EventBus.broadcast(
                Events.PLAYBACK_PROGRESS, {
                    time: currentTime
                }
            );
        }
    }

    onRateChange (e) {
        console.log("on ratechange");
        console.log("\n2222222222222222222222222222222222222222222222222222222222222222222222222222222");
        console.log(e);
    }

    reset () {
        for (let event in this._mediaEvents) {
            this._video.removeEventListener(event, this._mediaEvents[event]);
        }
    }
}

export default VideoTag;
