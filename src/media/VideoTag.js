import EventBus from "../lib/EventBus.js";
import Events from "Events.js";

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
            "seeking": this.onSeeking,
            "stalled": this.onStalled
        };
    }

    init () {
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

    getDuratioin () {
        return this._video.duration;
    }

    isPaused () {
        return this._video.paused;
    }

    // Media Events
    onPlay () {
        console.log("on play");
    }

    onPause () {
        console.log("on pause");
    }

    onSeeking () {
        console.log("on seeking");
    }

    onStalled () {
        console.log("on stalled");
    }
}

export default VideoTag;
