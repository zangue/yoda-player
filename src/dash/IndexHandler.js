import EventBus from "../lib/EventBus.js";
import Events from "../media/Events.js";

class IndexHandler {
    
    constructor (mediaType) {
        this.mediaType = mediaType;
        this.startIndex = null;
        this.lastLoadedIndex = null;
        this.index = null;
        this.segmentDuration = null;
        this.timescale = null;
    }

    setup () {
        EventBus.subscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
    }

    updateSegmentIndex (currentIndex) {
        this.lasLoadedIndex = currentIndex;
        this.index = currentIndex + 1;
    }

    onFragmentLoaded (e) {
        if (!e.fragment)
            return;

        if (e.fragment.mediaType !== this.mediaType || e.fragment.isInit)
            return;

        this.updateSegmentIndex(e.fragment.index);
    }

    reset () {
        EventBus.unsubscribe(Events.FRAGMENT_LOADED, this.onFragmentLoaded, this);
        this.setup();
    }

}


export default IndexHandler;