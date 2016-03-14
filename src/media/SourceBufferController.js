class SourceBufferController {

    createSourceBuffer (mediaSource, fullMimeType) {
        let sourceBuffer;

        try {
            sourceBuffer = mediaSource.addSourceBuffer(fullMimeType);
        } catch (e) {
            console.log("Failed to create source buffer: " + e.message);
        }

        return sourceBuffer;
    }

    removeSourceBuffer (mediaSource, sourceBuffer) {
        try {
            mediaSource.removeSourceBuffer(sourceBuffer);
        } catch (e) {
            console.log("Failed to remove source buffer: " + e.message);
        }
    }

}

export default SourceBufferController;
