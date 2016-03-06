(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _DashParser = require("./src/dash/DashParser.js");

var _DashParser2 = _interopRequireDefault(_DashParser);

var _Yoda = require("./src/Yoda.js");

var _Yoda2 = _interopRequireDefault(_Yoda);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var mpdUrl = "http://dash.edgesuite.net/envivio/Envivio-dash2/manifest.mpd";
var player = new _Yoda2.default();
var parser = new _DashParser2.default();

console.log("Creating the player...");
player.loadManifest(mpdUrl);

setTimeout(function () {
    var mpd = player.getManifest();
    console.log(mpd);
    parser.parse(mpd);
}, 2000);

},{"./src/Yoda.js":2,"./src/dash/DashParser.js":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _DashParser = require("./dash/DashParser.js");

var _DashParser2 = _interopRequireDefault(_DashParser);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Yoda = function () {
    function Yoda() {
        _classCallCheck(this, Yoda);

        this.manifest = null;
    }

    _createClass(Yoda, [{
        key: "loadManifest",
        value: function loadManifest(url) {
            var request = new XMLHttpRequest(),
                onload = undefined,
                onerror = undefined;

            onload = function onload() {
                if (request.status === 200) {
                    this.manifest = request.responseText;
                }
            };

            onerror = function onerror() {
                console.error("Could not load manifest.");
            };

            console.log("Loading manifest...");

            try {
                request.onload = onload.bind(this);
                request.onerror = onerror;

                request.open("GET", url, true);
                request.responseType = "text";
                request.send();
            } catch (e) {
                request.onerror();
            }
        }
    }, {
        key: "getManifest",
        value: function getManifest() {
            return this.manifest;
        }
    }]);

    return Yoda;
}();

exports.default = Yoda;

},{"./dash/DashParser.js":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _MPD = require("./mpd/MPD.js");

var _MPD2 = _interopRequireDefault(_MPD);

var _Period = require("./mpd/Period.js");

var _Period2 = _interopRequireDefault(_Period);

var _AdaptationSet = require("./mpd/AdaptationSet.js");

var _AdaptationSet2 = _interopRequireDefault(_AdaptationSet);

var _Representation = require("./mpd/Representation.js");

var _Representation2 = _interopRequireDefault(_Representation);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var DashParser = function () {
    function DashParser() {
        _classCallCheck(this, DashParser);
    }

    _createClass(DashParser, [{
        key: "parseAttribute",
        value: function parseAttribute(node, attr) {
            return node.getAttribute(attr);
        }
    }, {
        key: "parseRepresentation",
        value: function parseRepresentation(node) {}
    }, {
        key: "parseAdaptationSet",
        value: function parseAdaptationSet(node) {
            var as = new _AdaptationSet2.default();

            as.xlinkHref = this.parseAttribute(node, "xlink:href");
            as.xlinkActuate = this.parseAttribute(node, "xlink:actuate");
            as.id = this.parseAttribute(node, "id");
            as.group = this.parseAttribute(node, "group");
            as.lang = this.parseAttribute(node, "lang");
            as.contentType = this.parseAttribute(node, "contentType");
            as.par = this.parseAttribute(node, "par");
            as.minBandwidth = this.parseAttribute(node, "minBandwidth");
            as.maxBandwidth = this.parseAttribute(node, "maxBandwidth");
            as.minWidth = this.parseAttribute(node, "minWidth");
            as.maxWidth = this.parseAttribute(node, "maxWidth");
            as.minHeight = this.parseAttribute(node, "minHeight");
            as.maxHeight = this.parseAttribute(node, "maxHeight");
            as.minFrameRate = this.parseAttribute(node, "minFrameRate");
            as.maxFrameRate = this.parseAttribute(node, "maxFrameRate");
            as.segmentAlignment = this.parseAttribute(node, "segmentAlignment");
            as.bitStreamSwitching = this.parseAttribute(node, "bitStreamSwitching");
            as.subsegmentAlignment = this.parseAttribute(node, "subsegmentAlignment");
            as.subsegmentStartsWithSAP = this.parseAttribute(node, "subsegmentStartsWithSAP");

            return as;
        }
    }, {
        key: "parsePeriod",
        value: function parsePeriod(node) {
            var period = new _Period2.default(),
                adaptationSets = undefined;

            period.xlinkHref = this.parseAttribute(node, "xlink:href");
            period.xlinkActuate = this.parseAttribute(node, "xlink:actuate") || "onRequest";
            period.id = this.parseAttribute(node, "id");
            period.start = this.parseAttribute(node, "start");
            period.duration = this.parseAttribute(node, "duration");
            period.bitStreamSwitching = this.parseAttribute(node, "bitStreamSwitching");

            adaptationSets = node.children;

            for (var i = 0; i < adaptationSets.length; i++) {
                period.adaptationSets[i] = this.parseAdaptationSet(adaptationSets[i]);
            }

            return period;
        }
    }, {
        key: "parseMPD",
        value: function parseMPD(node) {
            var mpd = new _MPD2.default(),
                periods = undefined;

            mpd.id = this.parseAttribute(node, "id");
            mpd.profiles = this.parseAttribute(node, "profiles");
            mpd.type = this.parseAttribute(node, "type") || "static";
            mpd.availabilityStartTime = this.parseAttribute(node, "availabilityStartTime");
            mpd.publishTime = this.parseAttribute(node, "publishTime");
            mpd.availabilityEndTime = this.parseAttribute(node, "availabilityEndTime");
            mpd.mediaPresentationDuration = this.parseAttribute(node, "mediaPresentationDuration");
            mpd.minimumUpdatePeriod = this.parseAttribute(node, "minimumUpdatePeriod");
            mpd.minBufferTime = this.parseAttribute(node, "minBufferTime");
            mpd.timeShiftBufferDepth = this.parseAttribute(node, "timeShiftBufferDepth");
            mpd.suggestedPresentationDelay = this.parseAttribute(node, "suggestedPresentationDelay");
            mpd.maxSegmentDuration = this.parseAttribute(node, "maxSegmentDuration");
            mpd.maxSubSegmentDuration = this.parseAttribute(node, "maxSubSegmentDuration");

            periods = node.children;

            for (var i = 0; i < periods.length; i++) {
                //console.log(periods[i]);
                mpd.periods[i] = this.parsePeriod(periods[i]);
            }
            console.dir(mpd);

            return mpd;
        }
    }, {
        key: "parse",
        value: function parse(mpd) {
            var parser = new DOMParser(),
                xml = parser.parseFromString(mpd, "text/xml"),
                mpdNode = undefined,
                mpdObj = undefined;

            if (!xml) {
                console.error("Failed to parse Manifest file");
                return null;
            }

            console.log("Parsing MPD...");

            mpdNode = xml.getElementsByTagName("MPD")[0];

            mpdObj = this.parseMPD(mpdNode);

            return mpdObj;
        }
    }]);

    return DashParser;
}();

exports.default = DashParser;

},{"./mpd/AdaptationSet.js":4,"./mpd/MPD.js":5,"./mpd/Period.js":6,"./mpd/Representation.js":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var AdaptationSet = function AdaptationSet() {
    _classCallCheck(this, AdaptationSet);

    this.xlinkHref = null;
    this.xlinkActuate = null;
    this.id = null;
    this.group = null;
    this.lang = null;
    this.contentType = null;
    this.par = null;
    this.minBandwidth = null;
    this.maxBandwidth = null;
    this.minWidth = null;
    this.maxWidth = null;
    this.minHeight = null;
    this.maxHeight = null;
    this.minFrameRate = null;
    this.maxFrameRate = null;
    this.segmentAlignment = false;
    this.bitStreamSwitching = null;
    this.subsegmentAlignment = false;
    this.subsegmentStartsWithSAP = 0;
    this.accessibilities = [];
    this.roles = [];
    this.ratings = [];
    this.viewpoints = [];
    this.contentComponents = [];
    this.baseUrls = [];
    this.segmentBase = null;
    this.segmentList = null;
    this.segmentTemplate = null;
    this.representations = [];
};

exports.default = AdaptationSet;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var MPD = function MPD() {
    _classCallCheck(this, MPD);

    this.id = null;
    this.profiles = null;
    this.type = null;
    this.availabilityStartTime = null; // Must be present for @type='dynamic'
    this.publishTime = null; // Must be present for @type='dynamic'
    this.availabilityEndTime = null;
    this.mediaPresentationDuration = null;
    this.minimumUpdatePeriod = null;
    this.minBufferTime = null;
    this.timeShiftBufferDepth = null;
    this.suggestedPresentationDelay = null;
    this.maxSegmentDuration = null;
    this.maxSubSegmentDuration = null;
    this.programInformation = [];
    this.baseUrls = [];
    this.locations = [];
    this.periods = [];
    this.metrics = [];
};

exports.default = MPD;

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Period = function Period() {
    _classCallCheck(this, Period);

    this.xlinkHref = null;
    this.xlinkActuate = null;
    this.id = null;
    this.start = null;
    this.duration = null;
    this.bitStreamSwitching = false;
    this.baseUrls = [];
    this.segmentBase = null;
    this.segmentList = null;
    this.segmentTemplate = null;
    this.assetIdentifier = null;
    this.eventStreams = [];
    this.adaptationSets = [];
    this.subSets = [];
};

exports.default = Period;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Representation = function Representation() {
    _classCallCheck(this, Representation);

    this.id = null;
    this.bandwidth = null;
    this.qualityRanking = null;
    this.dependencyId = null;
    this.mediaStreamStructureId = null;
    this.baseUrls = [];
    this.subRepresentations = [];
    this.segmentBase = null;
    this.segmentList = null;
    this.segmentTemplate = null;
};

exports.default = Representation;

},{}]},{},[1]);
