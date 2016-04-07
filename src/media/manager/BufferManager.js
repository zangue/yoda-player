import DashDriver from "../../dash/DashDriver.js";
import Buffer from "../Buffer.js";

class BufferManager {
    constructor (mediaType, sourceBuffer) {
        this.mediaType = mediaType;
        this.sourceBuffer = sourceBuffer;
        this.virtualBuffer = new Buffer();
        this.manifestInfo = DashDriver.getManifestInfos();
    }

    // suscribe event
    setup() {
        this.sourceBuffer.addEventListener("updateend", this.onSourceBufferUpdateEnd.bind(this));
    }

    // append next
    onSourceBufferUpdateEnd () {
        console.log("onSourceBufferUpdateEnd");
        this.AppendToSource();
    }

    AppendToSource() {
        this.virtualBuffer.append(this.sourceBuffer);
    }

    canStartPlayback() {
        //console.log("maxSegmentDuration: " + this.manifestInfo.maxSegmentDuration);
        //console.log("minBufferTime: " + this.manifestInfo.minBufferTime);
        // TODO - check if we have minBufferTime.
        if (this.virtualBuffer.getLength() > 2) {
            return true;
        }

        return false;
    }

    // Check buffer level againt minBufferTime
    // get dash manifest information
    // decide
    shouldBuffer () {
        return true;
    }

    feedBuffer (fragment) {
        let wasDry = false;

        if (this.virtualBuffer.getLength() === 0)
            wasDry = true;

        this.virtualBuffer.push(fragment);

        if (wasDry)
            this.AppendToSource();

    }

    reset() {

    }
}

export default BufferManager;
