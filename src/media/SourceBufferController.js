class SourceBufferManager {

    createSourceBuffer (mediaSource, fullMimeType) {
        let sourceBuffer;

        try {
            sourceBuffer = mediaSource.addSourceBuffer()
        } catch (e) {
            console.log("Failed to create source buffer: " + e.message);
        }

        return sourceBuffer;
    }

}

export default SourceBufferManager;
