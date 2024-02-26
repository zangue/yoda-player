# Design overview

This document merely provides an overview of the implemented player design. It's by no means an elaborated technical documentation. The intent is to provide a good enough intuition to navigate the source code autonomously

## Block Diagram
The following block diagram shows a simplified overview of the main components and their relationships.

![Player Architecture](/docs/plyr-arch.jpeg?raw=true "Player Architecture")

## Implementation details
The player([`src/player.ts`](/src/player.ts)) is responsible of instantianting main
components and providing all required resources (e.g. the media element) needed
to setup playback.

The Parser ([`src/dash/manifest-parser.ts`](/src/dash/manifest-parser.ts)) is responsible of parsing the
manifest and providing the player with the parsed manifest model ([`IManifest`](/src/dash/types.ts)).
Furthermore, it's also responsible of autonomously refreshing a live manifest
and update the segment index ([`src/dash/segment-index.ts`](/src/dash/segment-index.ts)) with newly
advertised segments.

The MSE adapter ([`src/mse-adapter.ts`](/src/mse-adapter.ts)) is a wrapper around the [MSE APIs](https://www.w3.org/TR/media-source/).
It provides a promise-based abstraction layer to the player/streamer for setting up the [media source](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource) and [source buffers](https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer). This component also manages all operation related to the media source and source buffers.

The Streamer ([`src/streamer.ts`](/src/streamer.ts)) drives the playback session by downloading and buffering media data (segments) of each stream.
