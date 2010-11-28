(goggles)
=========

A little system in the tradition of [hoodwinkd][hoodwinkd], goggles lets you peer
behind the webpages you visit and draw things that other goggles users can see.
It's like an alternate dimension full of graffiti.

Goggles' graffiti is completely invisible to those who do not have their goggles
on.

Technical details
-----------------

There are four parts:

1. Landing page
2. Bookmarklet
3. Bookmarklet stage 2
4. Goggles server

The user goes to the [landing page][sneakygcr] where they will see the
bookmarklet button. The user then drags that bookmarklet to their bookmarks bar.

The bookmarklet code is straight inside the page's HTML and is automatically
"compressed" and "minified" by javascript on the landing page. (See the
[source code][landing source]).

The bookmarklet is pretty simple; it just chainloads the bigger 'stage 2' code
that is appended to the page. The server generates and serves the
[stage 2 code][stage 2 source] by concatenating all the files in the
bookmarklet.d folder together and then sending it through google's closure
compiler API.

The stage 2 code handles all of the drawing, presentation, and protocol. It
adds jquery to the web page (and tries to not conflict), adds a huge transparent
`<canvas/>` element and then streams shape updates from the server.

The server keeps track of the shapes, streams new shape events to clients with
jsonp, and manages pages.

Deploy details
==============

The server is written in nodejs. No extra dependencies are needed beyond
node 0.3.1 or better. Note that it's quite stupid; there are memory leaks and
the "database" is just filesystem-based storage using a repository format very
similar to git (see [keystore][keystore.js]). You will have to restart the
server from time to time if it gets popular.

Best served hiding behind nginx with transparent gzip turned on. Suggested nginx
configuration:

    server {
        listen   80;
        server_name goggles.sneakygcr.net;
        location = /favicon.ico { empty_gif; }

        location / {
            proxy_pass   http://127.0.0.1:8002;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_buffering off;

            gzip             on;
            gzip_comp_level  9;
            gzip_min_length  1000;
            gzip_proxied     any;
            gzip_types       text/plain text/javascript text/html;
            gzip_disable     "MSIE [1-6]\.";
        }
    }

[hoodwinkd]: http://web.archive.org/web/20080106065546/http://hoodwinkd.hobix.com/
[sneakygcr]: http://goggles.sneakygcr.net
[landing source]: https://github.com/gcr/goggles/blob/master/resources/index.htm
[stage 2 source]: https://github.com/gcr/goggles/tree/master/bookmarklet.d
[keystore.js]: https://github.com/gcr/goggles/blob/master/models/keystore.js
