import Yoda from "./src/Yoda.js";

//let mpdUrl = "http://dash.edgesuite.net/envivio/Envivio-dash2/manifest.mpd";
/*
let mpdUrl = "http://www-itec.uni-klu.ac.at/ftp/datasets/mmsys13/redbull_6sec.mpd";
let player = new Yoda();
let parser = new DashParser();
let manifestLoader = new ManifestLoader();

console.log("Creating the player...");
manifestLoader.load(mpdUrl);

setTimeout(function() {
    let mpd = manifestLoader.getManifest();
    console.log(mpd);
    let manifest = parser.parse(mpd);

    player.startup(manifest);
}, 2000);
*/

var context = window || global;

var yoda = context.yoda;
if (!yoda) {
    yoda = context.yoda = {}
}

yoda.Player = Yoda;

export default yoda;
export {Yoda};
