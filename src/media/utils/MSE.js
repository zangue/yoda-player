/**
 * @class MSE - Mediasource Extensions
 */
class MSE {
    static createMediaSource () {
        if (window.MediaSource) {
            return new window.MediaSource();
        } else {
            console.log("MediaSource not supported...");
        }

        return null;
    }

    static attachMediaSource (videoElement, mediaSource) {
        let objectURL = window.URL.createObjectURL(mediaSource);

        videoElement.setSource(objectURL);
    }

    static detachMediaSource (videoElement) {
        videoElement.setSource('');
    }

    static reateSourceBuffer (mediaSource, fullMimeType) {
        let sourceBuffer;

        try {
            sourceBuffer = mediaSource.addSourceBuffer(fullMimeType);
        } catch (e) {
            console.log("Failed to create source buffer: " + e.message);
        }

        return sourceBuffer;
    }

    static removeSourceBuffer (mediaSource, sourceBuffer) {
        try {
            mediaSource.removeSourceBuffer(sourceBuffer);
        } catch (e) {
            console.log("Failed to remove source buffer: " + e.message);
        }
    }
}

export default MSE;
