function activateGoggles() {
  (function($){
      if (window.goggled) { return; }
      window.goggled = true;

      var canvas;     // the canvas element
      var shapes=[];  // the list of shapes to draw
      // each shape looks like this:
      // {x: 0,
      //  y: 0,
      //  s: 10,                   radius (size)
      //  a: 0.5,                  alpha
      //  r: 250, g: 200, b: 125   color
      // }
      
      // for testing
      shapes = [
        {x: 0, y: 30, s: 50, a: 1, r: 255, g:0,b:0},
        {x: 250, y: 99, s: 50, a: 0.5, r:0, g:0,b:0},
        {x: 100,y:500,s:25,a:0.75,r:0,g:0,b:0}
      ];

      //for (var i=0; i<10000; i++) {
      //  shapes.push(
      //    {x: (Math.random()*2000)-1000,
      //     y: Math.random()*1000,
      //     s: Math.random()*10,
      //     a: Math.random(),
      //     r:0,g:0,b:0});
      //}
      //console.log(shapes[100]);

      function redraw() {
        var ctx = canvas.getContext('2d');
        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
          // establish a new coordinate system. (0, 0) is at the top MIDDLE of
          // the page, +x is right and -x is left.
          // this accomodates pages that have fixed-width or centered layouts.
          ctx.translate(canvas.width/2, 0);

          // todo: actually I would really like this to be relative to either
          // the left of the content or the middle of the page.

          // account for scrolling
          ctx.translate(-window.scrollX, -window.scrollY);

          var counter=0;
          for (var i=0,l=shapes.length; i<l; i++) {
            var shape = shapes[i];
            if ((shape.x + shape.s)+(canvas.width/2) > window.scrollX &&
                (shape.y + shape.s) > window.scrollY &&
                (shape.x - shape.s)+(canvas.width/2) < window.scrollX+window.innerWidth &&
                (shape.y - shape.s) < window.scrollY+window.innerWidth) {
                counter++;
              ctx.fillStyle = "rgba("+shape.r+","+shape.g+","+shape.b+","+shape.a+")";
              ctx.beginPath();
              ctx.arc( shape.x, shape.y, shape.s, 0, 2*Math.PI, true);
              ctx.fill();
            }
          }
          console.log("drew "+counter+" shapes");
        ctx.restore();

      }

      canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];

      function resizeCanvas() {
        // window has this:
        // window.innerWidth, window.innerHeight,
        // window.outerWidth, window.outerHeight (includes scrollbars, etc)
        // window.scrollX, window.scrollY
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(canvas.width, canvas.height);
        redraw();
      }
      resizeCanvas();

      var resizeTimer = null;
      function deferredResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 100);
      }



      window.onresize = deferredResize;
      window.onscroll = redraw;

  })(jQuery);
}

if (typeof jQuery == 'undefined') {
  var jQ = document.createElement('script');
  jQ.type = 'text/javascript';
  jQ.onload=activateGoggles;
  jQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
  document.body.appendChild(jQ);
} else {
  activateGoggles();
}
