import DashParser from "./src/dash/DashParser.js";
import Yoda from "./src/Yoda.js";

//let mpdUrl = "http://dash.edgesuite.net/envivio/Envivio-dash2/manifest.mpd";
let mpdUrl = "http://www-itec.uni-klu.ac.at/ftp/datasets/mmsys13/redbull_6sec.mpd";
let player = new Yoda();
let parser = new DashParser();

console.log("Creating the player...");
player.loadManifest(mpdUrl);

setTimeout(function() {
    let mpd = player.getManifest();
    console.log(mpd);
    parser.parse(mpd);
}, 2000);
