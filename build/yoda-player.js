(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _Yoda = require("./src/Yoda.js");

var _Yoda2 = _interopRequireDefault(_Yoda);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var mpdUrl = "http://dash.edgesuite.net/envivio/Envivio-dash2/manifest.mpd";
var player = new _Yoda2.default();

console.log("Creating the player...");
player.loadManifest(mpdUrl);

setTimeout(function () {
    var mpd = player.manifest;
    console.log(mpd);
}, 2000);

},{"./src/Yoda.js":2}],2:[function(require,module,exports){
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
    function Yoda(manifest) {
        _classCallCheck(this, Yoda);

        this._manifest = manifest;
    }

    _createClass(Yoda, [{
        key: "loadManifest",
        value: function loadManifest(url) {
            var request = new XMLHttpRequest(),
                onload = undefined,
                onerror = undefined;

            onload = function onload() {
                if (request.status === 200) {
                    this._manifest = request.responseText;
                    console.log("onload: " + this._manifest);
                }
            };

            onerror = function onerror() {
                console.error("Could not load manifest.");
            };

            console.log("Loading manifest...");

            try {
                request.onload = onload;
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
            console.log("getManifest: " + this._manifest);
            return this._manifest;
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
function DashParser() {

    function parse(mpd) {}
}

exports.default = DashParser;

},{}]},{},[1]);
