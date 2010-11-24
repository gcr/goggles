function activateGoggles() {
  (function($){
      if (window.goggled) { return; }
      window.goggled = true;

      var canvas;     // the canvas element
      var shapes=[];  // the list of shapes to draw. each shape is just a point
      // or circle; as part of a line.
      // each shape looks like this:
      // {p: [ [x,y], [x,y], [x,y], ...], pixels
      //  t: 5                            thickness
      //  r: 250, g: 200, b: 125, a: 0.5  color
      // }
      shapes = [
        {p: [ [0,0], [25, 350], [300, 90], [-55, 500]],
         t: 5,
         r:0,g:0,b:0,a:0.5}
      ];
      
      // Point transformation functions
      // Establish a new coordinate system. (0, 0) is at the top MIDDLE of
      // the page, +x is right and -x is left.
      // This accomodates pages that have fixed-width or centered layouts.
      // todo: actually I would really like this to be relative to either
      // the left of the content or the middle of the page.
      function transform(p) {
        // Given an absolute point, return the point's position on the screen
        return [
          p[0]-window.scrollX + (canvas.width/2),
          p[1]-window.scrollY
        ];
      }
      function untransform(p) {
        // Given an point wrt the screen, return the point's absolute position
        return [
          p[0]+window.scrollX - (canvas.width/2),
          p[1]+window.scrollY
        ];
      }

      // Drawing functions
      function drawShape(ctx, shape) {
        // Draw a given shape if it is in view.
//      if ((p.x + shape.s) > 0 &&
//          (p.y + shape.s) > 0 &&
//          (p.x - shape.s) < canvas.width &&
//          (p.y - shape.s) < canvas.height) {
          ctx.strokeStyle = "rgba("+shape.r+","+shape.g+","+shape.b+","+shape.a+")";
          ctx.lineWidth = shape.t;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo.apply(ctx, transform(shape.p[0]));
          for (var i=0,l=shape.p.length; i<l; i++) {
            ctx.lineTo.apply(ctx, transform(shape.p[i]));
          }
          ctx.stroke();
//       }
      }

      function redraw() {
        // Redraw entire canvas
        var ctx = canvas.getContext('2d');
        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i=0,l=shapes.length; i<l; i++) {
          var shape = shapes[i];
          drawShape(ctx, shape);
        }

      }

      // Event handling
      function pointsFromEv(ev) {
        if ('clientX' in ev) { // Firefox
          return [ev.clientX, ev.clientY];
        } else if ('offsetX' in ev) { // Opera
          return [ev.offsetX, ev.offsetY];
        }
      }
      function newShape(point) {
        // Create and return a new shape.
        var p = {x: untransform(point)[0],
                 y: untransform(point)[1]},
        shape = {
          p: [],
          t: 5,
          r:0,g:0,b:0,a:1
        };
        return shape;
      }
      function nextPoint(shape, point) {
        var abspoint = untransform(point),
            absprev = shape.p[shape.p.length-1],
            ctx = canvas.getContext('2d');
        if (absprev) {
          var relprev = transform(absprev||[0,0]);
          ctx.strokeStyle = "rgba("+shape.r+","+shape.g+","+shape.b+","+shape.a+")";
          ctx.lineWidth = shape.t;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo.apply(ctx, relprev);
          ctx.lineTo.apply(ctx, point);
          ctx.stroke();
        }
        shape.p.push(
          [Math.round(abspoint[0]*10)/10, Math.round(abspoint[1]*10)/10]
        );
      }


      //////// INIT
      function resizeCanvas() {
        // Fix the canvas when resized
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redraw();
      }
      var resizeTimer = null;
      function deferredResize() {
        // Resize later
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 100);
      }

      window.onresize = deferredResize;
      window.onscroll = redraw;

      canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];

      var curshape = null;
      canvas.onmousedown = function(ev) {
        curshape = newShape(pointsFromEv(ev));
      };
      canvas.onmouseup = function(ev) {
        shapes.push(curshape);
        curshape = null;
      };
      canvas.onmousemove = function(ev) {
        if (curshape) {
          nextPoint(curshape, pointsFromEv(ev));
        }
      };


      resizeCanvas();

      setInterval(function(){
          console.log(shapes.length);
          console.log("serialized size: "+JSON.stringify(shapes).length);
        }, 5000);

      window.shapes = shapes;

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
