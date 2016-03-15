import MediaInfo from "../media/params/MediaInfo.js";

class DashDriver {

    _getAdaptationForType (type, manifest) {
        let i,
            as,
            asType,
            period = manifest.periods[0]; // No support for multi period

        as = period.adaptationSets;

        for (i = 0; i < as.length; i++) {
            asType = as[i].common.mimeType.split('/')[0];

            if (asType == type) {
                return as[i];
            }
        }
    }

    getMediaInfoFor (mediaType, manifest) {
        let mediaInfo = new MediaInfo(),
            i,
            as = this._getAdaptationForType(mediaType, manifest),
            reps = as.representations;

        mediaInfo.id = as.id;
        mediaInfo.mimeType = as.mimeType;
        mediaInfo.codecs = as.common.codecs || reps[0].common.codecs || '';
        mediaInfo.lang = as.lang;

        for (i = 0; i < reps.length; i++) {
            mediaInfo.bitrates.push(parseInt(reps[i].bandwidth));
        }

        return mediaInfo;
    }


}

export default DashDriver;
