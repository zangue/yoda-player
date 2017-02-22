import DashDriver from "../../dash/DashDriver.js";

// TODO
// Each track can have its own @presentationTimeOffset, so we should set the offset
// if it has changed after switching the quality or updating an mpd

const MAX_BUFFER_AHEAD_LEVEL = 30;

class BufferManager {
    constructor (mediaType, sourceBuffer, videoTag) {
        this.mediaType = mediaType;
        this.sourceBuffer = sourceBuffer;
        this.videoTag = videoTag;
        this.manifestInfo = DashDriver.getManifestInfos();
        this.chunks = [];
    }

    get bufferLevel () {
        let level = 0;
        let time = this.videoTag.getElement().currentTime;
        let range = this.getBufferRange();

        if (Boolean(range))
            level = range.end - time;

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
    getBufferRange(buffer, time, tolerance) {
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
            ranges = buffer.buffered;
        } catch (ex) {
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
        }
    }

    // append next
    onSourceBufferUpdateEnd () {
        console.log("onSourceBufferUpdateEnd");
        this.AppendToSource();
    }

    AppendToSource() {
        let chunk, bytes;

        if (this.chunks.length === 0) {
            return;
        }

        if (this.sourceBuffer.updating) {
            console.log("Source Buffer updating: " + this.sourceBuffer.updating);
            return;
        }

        chunk = this.chunks.shift();


        console.log("\n\nappending to sourcebuffer\n\n");

        bytes = new Uint8Array(chunk.dataChunk);
        this.sourceBuffer.appendBuffer(bytes);
    }

    canStartPlayback() {
        let minBufferTime = this.manifestInfo.minBufferTime || 2;

        return this.chunks.length >= (minBufferTime * 2);
    }

    // Check buffer level againt minBufferTime or suggestedMinBufferTime
    // get dash manifest information
    // decide
    shouldBuffer () {
        return true;
    }

    feedBuffer (chunk) {
        this.chunks.push(chunk);
        this.AppendToSource();
    }

    reset() {
        this.chunks = [];
        this.sourceBuffer.removeEventListener("updateend", this.onSourceBufferUpdateEnd.bind(this), false);
    }
}

export default BufferManager;
