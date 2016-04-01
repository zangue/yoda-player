import MediaInfo from "../media/objects/infos/MediaInfo.js";

class DashDriver {

    _getAdaptationForType (type, manifest) {
        let i,
            as,
            asType,
            period = manifest.periods[0]; // No support for multi period

        as = period.adaptationSets;

        for (i = 0; i < as.length; i++) {
            if (as[i].mimeType) {
                asType = as[i].mimeType.split('/')[0];
            } else {
                asType = as[i].representations[0].mimeType.split('/')[0];
            }

            if (asType == type) {
                return as[i];
            }
        }
    }

    getRepresentationForBitrate (mediaType, bitrate, manifest) {
        let as = this._getAdaptationForType(mediaType, manifest),
            reps = as.representations,
            representation = null,
            i;

        for (i = 0; i < reps.length; i++) {
            let repBitrate = parseInt(reps[i].bandwidth);

            if (repBitrate === bitrate) {
                representation = reps[i];
                break;
            }
        }

        return representation;
    }

    _getSegmentsFromTemplate (representation) {

    }

    _getSegmentsFromList (representation) {
        let list = representation.segmentList[0].segmentUrls,
            i,
            segments = [];

        for (i = 0; i < list.length; i++) {
            segments.push(list[i].media);
        }

        return segments;
    }

    getMediaInfoFor (mediaType, manifest) {
        let mediaInfo = new MediaInfo(),
            i,
            as = this._getAdaptationForType(mediaType, manifest),
            reps = as.representations;

        mediaInfo.id = as.id;
        mediaInfo.mimeType = as.mimeType;
        mediaInfo.codecs = as.codecs || reps[0].codecs || '';
        mediaInfo.lang = as.lang;

        for (i = 0; i < reps.length; i++) {
            mediaInfo.bitrates.push(parseInt(reps[i].bandwidth));
        }

        return mediaInfo;
    }

    getSegments (representation) {
        let segments;

        if (representation.segmentList) {
            segments = this._getSegmentsFromList(representation);
        } else if (representation.segmentTemplate) {

        } else if (representation.segmentBase) {

        }

        return segments;
    }


}

export default DashDriver;
