// Fading.js

var FADE_URL = ["http://www.google.com//",
                "http://www.facebook.com//",
                "http://goggles.sneakygcr.net//",
                "http://www.reddit.com//",
                "http://www.google.com//webhp"
              ],
    FADE_INTERVAL = 5 * 60 * 1000,
    FADE_DIFF = 0.1,
    FADE_CUTOFF_THRESH = 0.1;

exports.fade = function(ps) {
  setInterval(function(){
      // Go through and fade every URL.
      FADE_URL.map(function(url) {
          console.log("Fading "+url+"...");
          // todo: serial
          ps.fadeShapes(url, FADE_DIFF, FADE_CUTOFF_THRESH);
        });

    }, FADE_INTERVAL);

};
