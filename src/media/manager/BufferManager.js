import DashDriver from "../../dash/DashDriver.js";
import Buffer from "../Buffer.js";

class BufferManager {
    constructor (mediaType, sourceBuffer) {
        this.mediaType = mediaType;
        this.sourceBuffer = sourceBuffer;
        this.buffer = new Buffer();
        this.manifestInfo = DashDriver.getManifestInfos();
    }

    // suscribe event
    setup() {
        this.sourceBuffer.addEventListener("updateend", this.onSourceBufferUpdateEnd.bind(this));
        //console.dir(this.manifestInfo); debugger;
    }

    // append next
    onSourceBufferUpdateEnd () {
        console.log("onSourceBufferUpdateEnd");
        this.AppendToSource();
    }

    AppendToSource() {
        this.buffer.append(this.sourceBuffer);
    }

    canStartPlayback() {
        //console.log("maxSegmentDuration: " + this.manifestInfo.maxSegmentDuration);
        //console.log("minBufferTime: " + this.manifestInfo.minBufferTime);
        // TODO - check if we have minBufferTime.
        if (this.buffer.getLength() > 4) {
            return true;
        }

        return false;
    }

    // Check buffer level againt minBufferTime or suggestedMinBufferTime
    // get dash manifest information
    // decide
    shouldBuffer () {
        return true;
    }

    feedBuffer (fragment) {
        let wasDry = false;

        if (this.buffer.getLength() === 0)
            wasDry = true;

        this.buffer.push(fragment);

        if (wasDry)
            this.AppendToSource();

    }

    reset() {

    }
}

export default BufferManager;
