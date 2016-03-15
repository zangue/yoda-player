/**
 * MediaSource Extensions Manager Class
 */
class MediaSourceManager {

    createMediaSource () {
        if (window.MediaSource) {
            return new window.MediaSource();
        } else {
            console.log("MediaSource not supported...");
        }

        return null;
    }

    attachMediaSource (videoElement, mediaSource) {
        let objectURL = window.URL.createObjectURL(mediaSource);

        videoElement.setSource(objectURL);
    }

    detachMediaSource (videoElement) {
        videoElement.setSource('');
    }
}

export default MediaSourceManager;