import DashParser from "./dash/DashParser.js";
import DashDriver from "./dash/DashDriver.js";
import IndexHandler from "./dash/IndexHandler.js";
import MediaInfo from "./media/objects/infos/MediaInfo.js";
import ManifestLoader from "./media/net/ManifestLoader.js";
import EventBus from "./lib/EventBus.js";
import Events from "./media/Events.js";
import MSE from "./media/utils/MSE.js";
import BufferManager from "./media/manager/BufferManager.js";
import StreamEngine from "./media/StreamEngine.js";
import VideoTag from "./media/VideoTag.js";

class Yoda {
    constructor (config) {
        this._config = config;
        this.video = null;
        this.videoCodec = null;
        //this.audioCodec = null;
        this.mediaSource = null;
        this.manifest = null;
        this.indexHandler = null;
        this.videoSourceBuffer = null;
        //this.audioSourceBuffer = null;
    }

    setup () {
        let baseUrl;
        let manifestLoader;

        if (!this._config.mpd) {
            throw "No source set!";
        }

        if (!this._config.id) {
            throw "Video element ID is missing!";
        }

        EventBus.subscribe(Events.MANIFEST_LOADED, this.onManifestLoaded, this);

        baseUrl = this._config.mpd.substr(0, this._config.mpd.lastIndexOf('/') + 1);

        DashDriver.setBaseUrl(baseUrl);

        console.log("base: " + baseUrl);

        manifestLoader = new ManifestLoader();

        manifestLoader.load(this._config.mpd);
    }

    onManifestLoaded (event) {
        let parser;
        let base;
        let minfos;

        if (!event.manifest) {
            console.log("onManifestLoaded: Could not load manifest file");
            throw "Could not load manifest file";
        }

        console.log("Manifest Loaded");
        //console.log(event.manifest);

        parser = new DashParser();

        //console.dir(parser.parse(event.manifest));
        this.manifest = parser.parse(event.manifest);

        // configure DashDriver
        DashDriver.setManifest(this.manifest);

        // prefer baseurl defined in manifest
        if (this.manifest.baseUrls){
            base = this.manifest.baseUrls[0].url;
            //console.log("baseUrl: " + this.manifest.baseUrls[0].url);
            if (base.substr(0,3) !== './')
                DashDriver.setBaseUrl(base);
        }

        this.videoCodec = DashDriver.getCodecFullNameForType("video");

        // Video Element
        this.video = new VideoTag(this._config.id);
        this.video.setup();

        // Check if can play the video
        //if (this.video.getElement().canPlayType(this.videoCodec))
        console.log("Can play type " + this.videoCodec + ": " + this.video.getElement().canPlayType(this.videoCodec));

        // create the MediaSource object
        this.mediaSource = MSE.createMediaSource();

        minfos = DashDriver.getManifestInfos();

        // Set video duration
        //if (minfos.mediaPresentationDuration)
        //    this.video.setDuration(minfos.mediaPresentationDuration);

        // Set source
        MSE.attachMediaSource(this.video, this.mediaSource);

        // add event listeners
        this.mediaSource.addEventListener("webkitsourceopen", this.onSourceOpened.bind(this), false);
        this.mediaSource.addEventListener("sourceopen", this.onSourceOpened.bind(this), false);
    }

    /**
     * Setup Buffers and Stream Engines
     */
    onSourceOpened () {
        console.log("Source is open");
        let vBufferManager;
        let vStreamEngine;

        console.log("Codec: " + this.videoCodec);
        //this.videoSourceBuffer = this.mediaSource.addSourceBuffer(this.videoCodec);
        this.videoSourceBuffer = this.mediaSource.addSourceBuffer("video/mp4");

        vBufferManager = new BufferManager("video", this.videoSourceBuffer);
        vBufferManager.setup();

        vStreamEngine = new StreamEngine("video", vBufferManager, this.video);
        vStreamEngine.setup();
        vStreamEngine.start();
    }

    reset () {
        EventBus.unsubscribe(Events.MANIFEST_LOADED, this.onManifestLoaded, this);

        this.setup();
    }

}

/*
class Yoda {
    constructor () {
        // set mimetype and codecs
        this.mimeType = "video/mp4";
        this.codecs = "avc1.42c01e";
        this.amimeType = "audio/mp4";
        this.acodecs = "mp4a.40.2";

        // create media source instance
        this.ms = new MediaSource();
        this.vsourceBuffer = null;
        this.asourceBuffer = null;
        this.segNum = 1;
        this.asegNum = 1;
        this.maxSegNum = 875;
        this.video = null;
        this.bufferCount = 0;

        this.dash = new DashDriver();
    }

    startup (manifest) {
        console.log("Starting up ...");
        let mediaInfo = this.dash.getMediaInfoFor("video", manifest);
        let audioInfo = this.dash.getMediaInfoFor("audio", manifest);
        let rep = this.dash.getRepresentationForBitrate("video", mediaInfo.bitrates[0], manifest);
        let urlList = this.dash.getSegments(rep);

        console.dir(mediaInfo);
        console.dir(audioInfo);
        console.dir(urlList);
        // add event listeners
        this.ms.addEventListener("webkitsourceopen", this.onSourceOpened.bind(this), false);
        this.ms.addEventListener("webkitsourceclose", this.onSourceClosed.bind(this), false);
        this.ms.addEventListener("sourceopen", this.onSourceOpened.bind(this), false);

        // get reference to video
        this.video = document.querySelector("video");

        // set mediasource as source for the video
        this.video.src = window.URL.createObjectURL(this.ms);
        this.video.width = 1280;
        this.video.height = 720;
    }

    onSourceOpened () {
        // create source buffer
        let value = this.mimeType + ';codecs="' + this.codecs + '"',
            avalue = this.amimeType + ';codecs="' + this.acodecs + '"',
            initSegmentURL = "http://www-itec.uni-klu.ac.at/ftp/datasets/mmsys13/video/redbull_6sec/2000kbps/redbull_720p_2000kbps_6sec_segmentinit.mp4";
            //initSegmentURL = "http://dash.edgesuite.net/envivio/Envivio-dash2/v3_257-Header.m4s";

        console.log("Add Video buffer");
        this.vsourceBuffer = this.ms.addSourceBuffer(value);
        console.log("MediaSource readystate: " + this.ms.readyState);

        // request initialization segment
        let request = new XMLHttpRequest();
        request.responseType = "arraybuffer";
        request.open("GET", initSegmentURL, true);
        request.onload = (function () {
            let array = new Uint8Array(request.response);

            this.vsourceBuffer.appendBuffer(array);

            // wait until the sourceBuffer is primed with the initialization
            // before loading contentType
            this.vsourceBuffer.addEventListener("updateend", this.loadSegment.bind(this));
        }).bind(this);
        request.send();
    }

    onSourceClosed () {

    }

    loadSegment () {
        //if (Math.abs(this.asegNum - this.segNum) > 2) return;
        if (this.segNum < this.maxSegNum) {
            this.getSegment();
            this.segNum++;
        }
    }

    getSegment () {
        let request = new XMLHttpRequest(),
            segmentURL = "http://www-itec.uni-klu.ac.at/ftp/datasets/mmsys13/video/redbull_6sec/2000kbps/redbull_720p_2000kbps_6sec_segment" + this.segNum + ".m4s";
            //segmentURL = "http://dash.edgesuite.net/envivio/Envivio-dash2/v3_257-270146-i-" + this.segNum + ".m4s";


        console.log("Getting segment: " + segmentURL);
        request.responseType = "arraybuffer";
        request.open("GET", segmentURL, true);
        request.onload = (function () {
            let array = new Uint8Array(request.response);
            this.vsourceBuffer.appendBuffer(array);
        }).bind(this);
        request.send();
    }

    play () {

    }
}
*/
export default Yoda;
