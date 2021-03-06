class Events {
    constructor () {
        // VideoTag
        this.PLAYBACK_PAUSED = "pause";
        this.PLAYBACK_PLAY = "play";
        this.PLAYBACK_SEEKING = "seeking";
        this.PLAYBACK_SEEKED = "seeked";
        this.PLAYBACK_STALLED = "stalled";
        this.PLAYBACK_ENDED = "ended";
        this.PLAYBACK_CANPLAYTHROUGH = "canplaythrough";
        this.PLAYBACK_PROGRESS  = "timeupdate";

        // ManifestLoader
        this.MANIFEST_LOADED = "manifestLoaded";

        // FragmentLoader
        this.FRAGMENT_LOADED = "fragmentLoaded";
        this.FRAGMENT_PROGRESS = "fragmentProgress";

        // BufferManager
        this.INIT_REQUESTED = "initRequested";
        this.SOURCE_BUFFER_UPDATED = "sourceBufferUpdated";
    }
}

let events = new Events();
export default events;
