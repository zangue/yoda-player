class FragmentRequest {

    constructor () {
        this.mediaType = null;
        this.range = null;
        this.url = null;
        this.bitrate = null;
        this.index = NaN;
        this.responseType = "arraybuffer";
    }

}

export default FragmentRequest;
