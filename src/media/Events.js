class Events {
    constructor () {
        // VideoTag
        this.PLAYBACK_PAUSED = "pause";
        this.PLAYBACK_RESUMED = "play";
        this.PLAYBACK_SEEKING = "seeking";
        this.PLAYBACK_STALLED = "stalled";
    }
}

let events = new Events();
export default events;
