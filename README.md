Yoda Player
===========

Yoda player (**Y**et an**O**ther **DA**SH player) is a TypeScript library that implements an [MPEG-DASH](https://www.mpeg.org/standards/MPEG-DASH/) client. It can
be used for playback in web based environments that provide [HTML5 <video>](https://html.spec.whatwg.org/multipage/media.html#the-video-element) and [MediaSource Extensions](https://www.w3.org/TR/media-source/) APIs.

Furthermore, the library currently relies on [DOMParser](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsing-and-serialization) and [Document](https://developer.mozilla.org/en-US/docs/Web/API/Document#specifications) to parse XML.

Disclaimer
----
This is an experimental project. Please, **DO NOT** use in any production environment! If you're looking for an open-source, production ready media player I recommend you consider following projects instead:
- [Shaka Player](https://github.com/shaka-project/shaka-player)
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js)
- [hls.js](https://github.com/video-dev/hls.js)
- [RxPlayer](https://github.com/canalplus/rx-player)

Getting started
-----
Make sure you have [git](https://git-scm.com/downloads) and [nodejs/npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed on your machine.

1. Checkout repository
2. Install the dependencies
3. build

```
git clone git@github.com:zangue/yoda-player.git
cd yoda-player
npm install
npm run build
```

Basic Usage
-----------
This is an example of how you can embed Yoda Player into your HTML page.

```html
<!doctype html>

<html lang="en">
  <head>
    <meta charset="utf-8">
  </head>

  <body>
    <video id="video" controls="true" autoplay="true"></video>

    <script src="path/to/yoda-player.js"></script>
    <script>
      var mediaElement = document.getElementById('video');
      var streamUrl = 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';

      var player = new yoda.Player(mediaElement);

      player.load(streamUrl);
    </script>
  </body>
</html>
```

License
-------

This software is being made available under the terms of the MIT license. Please
refer to the LICENSE.md file within this directory.
