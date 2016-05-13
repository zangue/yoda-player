YODA PLAYER
===========

YODA player (**Y**et an**O**ther **DA**SH player) is a client implementation for
playback of MPEG-DASH in compliant browser environments.

Build
-----

Note: You will need to have nodejs / npm and gulp installed on your machine

1. Download source
2. Install the dependencies
3. Trigger build

```
git clone git@github.com:zangue/yoda-player.git
cd yoda-player
npm install
gulp make
```

Basic Usage
-----------

You will to create a video element within your HTML and assign it an id. Then add
the player and initialize it

```html
<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8">
</head>

<body>
  <script src="path/to/yoda-player.js"></script>
  <video id="video" controls="true" autoplay="true"></video>
  <script>
    var config = {
        mpd: "http://www.bok.net/dash/tears_of_steel/cleartext/stream.mpd",
        id: "video"
    };
    var player = new yoda.Player(config);

    player.setup();
  </script>
</body>
</html>
```

License
-------

This software is being available made under the terms of the MIT license. Please
refer to the LICENSE.md file within this directory.
