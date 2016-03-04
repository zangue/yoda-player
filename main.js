import Yoda from "./src/Yoda.js";

let mpdUrl = "http://dash.edgesuite.net/envivio/Envivio-dash2/manifest.mpd";
let player = new Yoda();

console.log("Creating the player...");
player.loadManifest(mpdUrl);

setTimeout(function() {
    let mpd = player.getManifest();
    console.log(mpd);
}, 2000);
