import DashParser from "./dash/DashParser.js";
import DashDriver from "./dash/DashDriver.js";
import MediaInfo from "./media/objects/infos/MediaInfo.js";
import ManifestLoader from "./media/http/ManifestLoader.js";
import EventBus from "./lib/EventBus.js";
import Events from "./media/Events.js";
import BufferManager from "./media/manager/BufferManager.js";
import StreamEngine from "./media/StreamEngine.js";
import VideoTag from "./media/VideoTag.js";

class Yoda {
    constructor (config) {
        this._config = config;
        this.video = null;
        this.mediaSource = null;
        this.manifest = null;
        this.autoPlay = false;
    }

    setup () {
        let manifestLoader = new ManifestLoader();

        if (!this._config.mpd) {
            throw new Error("No source set!");
        }

        if (!this._config.id) {
            throw new Error("Video element ID is missing!");
        }

        //EventBus.subscribe(Events.MANIFEST_LOADED, this.onManifestLoaded, this);

        manifestLoader.load(this._config.mpd).then( (data) => {
            console.log("Manifest Loaded");
            let minfos;

            this.parseManifest(data.manifest);
            this.configureDriver();
            this.createAndSetupVideo();

            minfos = DashDriver.getManifestInfos();

            if (minfos.type === "dynamic") {
                console.log("Trying to play unsupported type: " + minfos.type);
                throw new Error("Live Streaming is not suported!");
            }

            console.log("creating the media source object");

            this.createMediaSource();
            this.attachMediaSource();
            this.setupMediaSource();

            console.log("done");

        }).catch( (error) => {
            console.error('Error occurred!', error);
        });
    }

    getBaseUrl () {
        let base;

        base = this._config.mpd.substr(0, this._config.mpd.lastIndexOf('/') + 1);
        console.dir(this.manifest);
        // prefer baseurl defined in manifest
        if (this.manifest.baseUrls.length){
            let b = this.manifest.baseUrls[0].url;
            if (b.substr(0,3) !== './')
                base = b;
        }

        console.log('Base URL is: ' + base);
        return base;
    }

    configureDriver () {
        DashDriver.setManifest(this.manifest);
        DashDriver.setBaseUrl(this.getBaseUrl());
    }

    createAndSetupVideo () {
        this.video = new VideoTag(this._config.id);
        this.video.setup();
    }

    parseManifest (manifest) {
        let parser = new DashParser();
        this.manifest = parser.parse(manifest);
        console.dir(this.manifest);
    }

    getCodecForType (type) {
        return DashDriver.getCodecFullNameForType(type);
    }

    supportCodec (codec) {
        return this.video.getElement().canPlayType(codec);
    }

    createMediaSource () {
        if (window.MediaSource) {
            this.mediaSource = new window.MediaSource();
        } else {
            throw "MediaSource not supported...";
        }
    }

    attachMediaSource () {
        let objectURL = window.URL.createObjectURL(this.mediaSource);
        this.video.setSource(objectURL);
    }

    setupMediaSource () {
        this.mediaSource.addEventListener("webkitsourceopen", this.onSourceOpened.bind(this), false);
        this.mediaSource.addEventListener("sourceopen", this.onSourceOpened.bind(this), false);
    }

    initializeStream (type, codec) {
        let sourceBuffer;
        let bufferManager;
        let streamEngine;

        if (this.supportCodec(codec)) {
            console.log(type + 'Codec (' + codec + ') is ' + this.supportCodec(codec) + ' supported.');
            sourceBuffer = this.mediaSource.addSourceBuffer(codec);

            bufferManager = new BufferManager(type, sourceBuffer, this.video);
            bufferManager.setup();

            streamEngine = new StreamEngine(type, bufferManager, this.video);
            streamEngine.setup();
        } else {
            console.log(type + 'Codec (' + codec + ') is not supported.');
            streamEngine = null;
        }


        return streamEngine;
    }

    /**
     * initialize and start streams on autoPlay true
     */
    onSourceOpened () {
        console.log("Source is open");
        let streamEngines = [];

        streamEngines.push(this.initializeStream('video', this.getCodecForType('video')));
        streamEngines.push(this.initializeStream('audio', this.getCodecForType('audio')));

        streamEngines.forEach(se => {
            if (se && this.autoPlay) {
                se.start();
            }
        });
    }

    /**
     * Configure the player whether to start playback on load or not
     * @param {Boolean} value
     */
    setAutoPlay (value) {
        this.autoPlay = value;
    }

    /**
     * Get the auto-play config value
     * @return {Boolean}
     */
    getAutoPlay () {
        return this.autoPlay;
    }

    reset () {
        //EventBus.unsubscribe(Events.MANIFEST_LOADED, this.onManifestLoaded, this);
        this.mediaSource.removeEventListener("webkitsourceopen", this.onSourceOpened.bind(this), false);
        this.mediaSource.removeEventListener("sourceopen", this.onSourceOpened.bind(this), false);

        this.setup();
    }

}

export default Yoda;
