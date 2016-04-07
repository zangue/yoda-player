class Buffer {
    constructor () {
        this.fragments = [];
    }

    getLength () {
        return this.fragments.length;
    }

    push (fragment) {
        this.fragments.push(fragment);
    }

    flush () {
        this.fragments = [];
    }

    append (sourceBuffer) {
        //console.trace();
        console.log("\n\n VIRTUAL BUFFER SIZE: " + this.fragments.length + "  \n\n");
        if (sourceBuffer.updating) {
            console.log("Source Buffer updating: " + sourceBuffer.updating);
            return;
        }

        let fragment = this.fragments.shift();

        if (!fragment) {
            return;
        }

        console.log("\n\nappending to sourcebuffer\n\n");
        //console.dir(fragment);
        //console.dir(sourceBuffer);
        //console.log("Type of dataChunk: " + typeof fragment.dataChunk);
        //console.log("dataChunk: " + fragment.dataChunk);
        //while (sourceBuffer.updating) {
        //    continue;
        //}
        let chunk = new Uint8Array(fragment.dataChunk);
        sourceBuffer.appendBuffer(chunk);
    }
}

export default Buffer;
