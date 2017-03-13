import DashDriver from "../../dash/DashDriver.js";
import EventBus from "../../lib/EventBus.js";
import Events from "../Events.js";

// TODO
// Each track can have its own @presentationTimeOffset, so we should set the offset
// if it has changed after switching the quality or updating an mpd

const MAX_BUFFER_AHEAD_LEVEL = 45;

class BufferManager {
    constructor (mediaType, sourceBuffer, videoTag) {
        this.mediaType = mediaType;
        this.sourceBuffer = sourceBuffer;
        this.videoTag = videoTag;
        this.manifestInfo = DashDriver.getManifestInfos();
        this.lastAppendedChunk = null;
        this.reInit = false;
        this.initCache = [];
        this.chunks = [];
    }

    get bufferLevel () {
        let level = 0;
        let time = this.videoTag.getElement().currentTime;
        let range = this.getBufferRange(time);

        if (Boolean(range))
            level = range.end - time;

        console.log("Current buffer level: " + level + " second(s)");

        return level;
    }

    // suscribe event
    setup() {
        this.sourceBuffer.addEventListener("updateend", this.onSourceBufferUpdateEnd.bind(this), false);
        //console.dir(this.manifestInfo); debugger;
    }

    /*
     * This method is stolen from dash.js player :P
     * @author dash-if
     */
    getBufferRange(time, tolerance) {
        let ranges = null;
        let start = 0;
        let end = 0;
        let firstStart = null;
        let lastEnd = null;
        let gap = 0;

        let len,
            i;

        let toler = (tolerance || 0.15);

        try {
            ranges = this.sourceBuffer.buffered;
        } catch (ex) {
            console.log(ex);
            return null;
        }

        if (ranges !== null && ranges !== undefined) {
            for (i = 0, len = ranges.length; i < len; i++) {
                start = ranges.start(i);
                end = ranges.end(i);
                if (firstStart === null) {
                    gap = Math.abs(start - time);
                    if (time >= start && time < end) {
                        // start the range
                        firstStart = start;
                        lastEnd = end;
                    } else if (gap <= toler) {
                        // start the range even though the buffer does not contain time 0
                        firstStart = start;
                        lastEnd = end;
                    }
                } else {
                    gap = start - lastEnd;
                    if (gap <= toler) {
                        // the discontinuity is smaller than the tolerance, combine the ranges
                        lastEnd = end;
                    } else {
                        break;
                    }
                }
            }

            if (firstStart !== null) {
                return {start: firstStart, end: lastEnd};
            }
        } else {
            return null;
        }
    }

    removeBufferRange() {

    }

    // append next
    onSourceBufferUpdateEnd () {
        console.log("onSourceBufferUpdateEnd");
        this.AppendToSource();
    }

    AppendToSource() {
        let chunk, bytes;
        let isInitRequested = false;

        if (this.chunks.length === 0) {
            return;
        }

        if (this.sourceBuffer.updating) {
            console.log("Source Buffer updating: " + this.sourceBuffer.updating);
            return;
        }

        if (this.lastAppendedChunk === null || this.reInit ||
            this.lastAppendedChunk.bitrate !== this.chunks[0].bitrate) {
            // We need to append init for the current representation first.
            isInitRequested = true;
            this.reInit = false;
            chunk = this.getInitFromCache(this.chunks[0].bitrate);

            if (!chunk) {
                EventBus.broadcast(
                    Events.INIT_REQUESTED, {
                        mediaType: this.mediaType,
                        bitrate: this.chunks[0].bitrate
                    }
                );
                return;
            }
        } else {
            chunk = this.chunks.shift();
        }

        console.log("\n\nappending to sourcebuffer\n\n");

        bytes = new Uint8Array(chunk.dataChunk);
        this.sourceBuffer.appendBuffer(bytes);

        this.lastAppendedChunk = chunk;
    }

    canStartPlayback() {
        let minBufferTime = this.manifestInfo.minBufferTime || 2;

        return this.chunks.length >= (minBufferTime * 2);
    }

    shouldBufferMore () {
        return this.bufferLevel < MAX_BUFFER_AHEAD_LEVEL;
    }

    feedBuffer (chunk) {
        this.chunks.push(chunk);
        this.AppendToSource();
    }

    getInitFromCache (bitrate) {
        let init = null;

        for (let i = this.initCache.length - 1; i >= 0; i--) {
            if (this.initCache[i].bitrate === bitrate) {
                init = this.initCache[i];
                break;
            }
        }

        return init;
    }

    cacheInit (initChunk) {
        let hit = false;

        for (let i = this.initCache.length - 1; i >= 0; i--) {
            if (this.initCache[i].bitrate === initChunk.bitrate) {
                hit = true;
                break;
            }
        }

        if (!hit)
            this.initCache.push(initChunk);

        // Try append to source buffer in case we were waiting for an init segment
        this.AppendToSource();
    }

    bufferContains (time) {
        // TODO
    }

    abort () {
        try {
            this.sourceBuffer.abort();
        } catch (e) {
            console.log(e);
        } finally {
            this.chunks = [];
            this.reInit = true;
        }
    }

    reset() {
        this.chunks = [];
        this.sourceBuffer.removeEventListener("updateend", this.onSourceBufferUpdateEnd.bind(this), false);

        this.setup();
    }
}

export default BufferManager;
