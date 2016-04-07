class Events {
    constructor () {
        // VideoTag
        this.PLAYBACK_PAUSED = "pause";
        this.PLAYBACK_RESUMED = "play";
        this.PLAYBACK_SEEKING = "seeking";
        this.PLAYBACK_STALLED = "stalled";

        // ManifestLoader
        this.MANIFEST_LOADED = "manifestLoaded";

        // FragmentLoader
        this.FRAGMENT_LOADED = "fragmentLoaded";
        this.FRAGMENT_PROGRESS = "fragmentProgress";
    }
}

let events = new Events();
export default events;
