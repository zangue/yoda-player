import MediaInfo from "../media/params/MediaInfo.js";

class DashDriver {

    _getAdaptationForType (type, manifest) {
        let i, j,
            as,
            asType,
            periods = manifest.periods[0]; // No support for multi period

        for (i = 0; i < periods.length; i++) {
            as = periods[i].adaptationSets;

            for (j = 0; i < as.length; i++) {
                asType = as.common.mimeType.split('/')[0];

                if (asType == type) {
                    return as;
                }
            }
        }
    }

    getMediaInfoFor (mediaType, manifest) {
        let mediaInfo = new MediaInfo,
            i,
            as,
            reps = as.representations;

        as = this._getAdaptationForType(mediaType, manifest);

        mediaInfo.id = as.id;
        mediaInfo.mimeType = as.mimeType;
        mediaInfo.codecs = as.common.codecs || reps[0].common.codecs || '';
        mediaInfo.lang = as.lang;

        for (i = 0; i < reps.length; i++) {
            mediaInfo.bitrates.push(parseInt(reps[i].bandwidth));
        }
    }


}

export default DashDriver;
