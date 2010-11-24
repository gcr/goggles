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

      function transform(x, y) {
        // given an absolute point, return the point's position on the screen
        return {
          x: x-window.scrollX + (canvas.width/2),
          y: y-window.scrollY
        };
      }

      function untransform(x, y) {
        // given an point wrt the screen, return the point's absolute position
        return {
          x: x+window.scrollX - (canvas.width/2),
          y: y+window.scrollY
        };
      }

      function drawShape(ctx, x,y,s,a,r,g,b) {
        // x, y, size (radius), alpha, red, green, blue
        var p = transform(x, y);
        if ((p.x + s) > 0 &&
            (p.y + s) > 0 &&
            (p.x - s) < canvas.width &&
            (p.y - s) < canvas.height) {
          ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
          ctx.beginPath();
          ctx.arc( p.x, p.y, s, 0, 2*Math.PI, true);
          ctx.fill();
        }
      }

      function redraw() {
        var ctx = canvas.getContext('2d');
        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // establish a new coordinate system. (0, 0) is at the top MIDDLE of
        // the page, +x is right and -x is left.
        // this accomodates pages that have fixed-width or centered layouts.

        // todo: actually I would really like this to be relative to either
        // the left of the content or the middle of the page.

        for (var i=0,l=shapes.length; i<l; i++) {
          var shape = shapes[i];
          drawShape(ctx, shape.x, shape.y, shape.s, shape.a, shape.r, shape.g, shape.b);
        }

      }

      function pointsFromEv(ev) {
        if ('clientX' in ev) { // Firefox
          return {x: ev.clientX, y: ev.clientY};
        } else if ('offsetX' in ev) { // Opera
          return {x: ev.offsetX, y: ev.offsetY};
        }
      }

      canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];
      canvas.onmousedown = function(ev) {
        var point = pointsFromEv(ev),
        // TODO: breaks because chrome interprets it as an absolute document
        // position while fx interprets it wrt. screen position
            p = untransform(point.x, point.y),
            shape = {
              x: p.x,
              y: p.y,
              s: 10,
              a: 1,
              r:0,g:0,b:0
            };

        shapes.push(shape);
        drawShape(canvas.getContext('2d'), shape.x,shape.y,shape.s,shape.a,shape.r,shape.g,shape.b);
      };
      canvas.onmouseup = function(ev) {

      };
      canvas.onmousemove = function(ev) {

      };
      function resizeCanvas() {
        // window has this:
        // window.innerWidth, window.innerHeight,
        // window.outerWidth, window.outerHeight (includes scrollbars, etc)
        // window.scrollX, window.scrollY
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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
