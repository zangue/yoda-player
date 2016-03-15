class IndexHandler {

    constructor (type) {
        this._index = -1;
        this._type = type;
    }

    getInitRequest(representation) {
        return null;
    }

    getNextFragmentRequest () {
        return null;
    }

}

export default IndexHandler;
