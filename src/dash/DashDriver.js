import MediaInfo from "../media/objects/infos/MediaInfo.js";
import ManifestInfo from "../media/objects/infos/ManifestInfo.js";

const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
const SECONDS_IN_DAY = 24 * 60 * 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_MIN = 60;
const MINUTES_IN_HOUR = 60;
const MILLISECONDS_IN_SECONDS = 1000;

class DashDriver {

    constructor () {
        this.manifest = null;
        this.baseUrl = null;
    }

    _getAdaptationForType (type) {
        let i,
            as,
            asType,
            period = this.manifest.periods[0]; // No support for multi period

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

    setManifest (manifest) {
        this.manifest = manifest;
    }

    getAdaptationSetForType(type) {
        return this._getAdaptationForType(type);
    }

    getBaseUrl () {
        return this.baseUrl;
    }

    setBaseUrl (baseUrl) {
        this.baseUrl = baseUrl;
    }

    getCodecFullNameForType (type) {
        let i,
            as,
            asType,
            mimeType,
            codecs,
            period = this.manifest.periods[0]; // No support for multi period

        as = period.adaptationSets;

        for (i = 0; i < as.length; i++) {
            if (as[i].mimeType) {
                asType = as[i].mimeType.split('/')[0];
            } else {
                asType = as[i].representations[0].mimeType.split('/')[0];
            }

            if (asType == type) {
                mimeType = as[i].mimeType || as[i].representations[0].mimeType;
                codecs = as[i].codecs || as[i].representations[0].codecs;

                return mimeType + ';codecs="' + codecs + '"';
            }
        }
    }

    getRepresentationForBitrate (mediaType, bitrate) {
        let as = this._getAdaptationForType(mediaType),
            reps = as.representations,
            representation = null,
            i;

            bitrate = parseInt(bitrate);

        for (i = 0; i < reps.length; i++) {
            let repBitrate = parseInt(reps[i].bandwidth);

            if (repBitrate === bitrate) {
                console.log("[DashDriver] getRepresentationForBitrate(): found representation with id " + reps[i].id + " for bitrate " + bitrate);
                representation = reps[i];
                break;
            }
        }
        //console.dir(representation);
        return representation;
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

    getMediaInfoFor (mediaType) {
        let mediaInfo = new MediaInfo(),
            i,
            as = this._getAdaptationForType(mediaType),
            reps = as.representations;

        mediaInfo.id = as.id;
        mediaInfo.mediaType = mediaType;
        mediaInfo.mimeType = as.mimeType;
        mediaInfo.codecs = as.codecs || reps[0].codecs || '';
        mediaInfo.lang = as.lang;

        for (i = 0; i < reps.length; i++) {
            mediaInfo.bitrates.push(parseInt(reps[i].bandwidth));
        }

        if (this.hasSegmentTemplate(mediaType)) {
            mediaInfo.segmentDuration = as.segmentTemplate[0].duration;
            mediaInfo.timescale = as.segmentTemplate[0].timescale || 1;
        } else if (this.hasSegmentList(mediaType)) {
            mediaInfo.segmentDuration = as.segmentList[0].duration;
            mediaInfo.timescale = as.segmentList[0].timescale || 1;

            // reprsentation settings override adaptation set level settings
            if (as.representations[0].segmentList[0].duration) {
                mediaInfo.segmentDuration = as.representations[0].segmentList[0].duration;
                mediaInfo.timescale = as.representations[0].segmentList[0].timescale || 1;
            }
        } else {
            throw "Unknown or unsupported segment type";
        }



        console.log("§§§§§§§§§§§§§§§§§§§§§§");
        console.log(as);
        console.log(mediaInfo);
        mediaInfo.segmentDuration = parseInt(mediaInfo.segmentDuration);
        mediaInfo.timescale = parseInt(mediaInfo.timescale);

        return mediaInfo;
    }

    _caclDuration (str) {
        console.log("Calc duration: " + str);
        let regex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/;
        let match = regex.exec(str);

        if (!str)
            return null;

        var result = (parseFloat(match[2] || 0) * SECONDS_IN_YEAR +
            parseFloat(match[4] || 0) * SECONDS_IN_MONTH +
            parseFloat(match[6] || 0) * SECONDS_IN_DAY +
            parseFloat(match[8] || 0) * SECONDS_IN_HOUR +
            parseFloat(match[10] || 0) * SECONDS_IN_MIN +
            parseFloat(match[12] || 0));

        if (match[1] !== undefined) {
            result = -result;
        }
        console.log("duration: " + result);
        return result;
    }

    getManifestInfos () {
        let infos = new ManifestInfo();

        infos.profiles = this.manifest.profiles;
        infos.type = this.manifest.type;
        infos.availabilityStartTime = this.manifest.availabilityStartTime;
        infos.publishTime = this.manifest.publishTime;
        infos.availabilityEndTime = this.manifest.availabilityEndTime;
        infos.mediaPresentationDuration = this._caclDuration(this.manifest.mediaPresentationDuration);
        infos.minimumUpdatePeriod = this._caclDuration(this.manifest.minimumUpdatePeriod);
        infos.minBufferTime = this._caclDuration(this.manifest.minBufferTime);
        infos.timeShiftBufferDepth = this._caclDuration(this.manifest.timeShiftBufferDepth);
        infos.suggestedPresentationDelay = this._caclDuration(this.manifest.suggestedPresentationDelay);
        infos.maxSegmentDuration = this._caclDuration(this.manifest.maxSegmentDuration);
        infos.maxSubSegmentDuration = this._caclDuration(this.manifest.maxSubSegmentDuration);

        return infos;
    }

    getSegment (representation, index) {
        let segment;

        if (representation.segmentList) {

        } else if (representation.segmentTemplate) {

        } else if (representation.segmentBase) {

        } else {
            throw "unsupported segment type";
        }

        return segment;
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

    getSegmentList (representation) {
        return this._getSegmentsFromList(representation);
    }

    getSegmentBase (representation) {
        // TODO
    }

    getSegmentTemplate (representation) {
        // TODO
    }

    hasSegmentBase (type) {
        let as = this._getAdaptationForType(type);

        if (as.representations[0].segmentBase.length)
            return true;

        return false;
    }

    hasSegmentList (type) {
        let as = this._getAdaptationForType(type);

        if (as.representations[0].segmentList.length)
            return true;

        return false;
    }

    hasSegmentTemplate (type) {
        let as = this._getAdaptationForType(type);

        if (as.segmentTemplate.length)
            return true;

        return false;
    }
}

let dashDriver = new DashDriver();
export default dashDriver;
