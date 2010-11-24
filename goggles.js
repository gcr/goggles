function activateGoggles() {
  (function($){
      if (window.goggled) { return; }
      window.goggled = true;

      function bind(bindee, action) {
        return function() {
          return action.apply(bindee, Array.prototype.slice.call(arguments));
        };
      }

      function Goggles() {
        this.canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];

        this.ctx = this.canvas.getContext('2d');

        this.shapes = []; // the list of shapes to draw. each shape is just a point
        // or circle; as part of a line.
        // each shape looks like this:
        // {p: [ [x,y], [x,y], [x,y], ...], pixels
        //  t: 5                            thickness
        //  r: 250, g: 200, b: 125, a: 0.5  color
        // }
        this.curshape = null;
        this.canvas.onmousedown = bind(this, function(ev) {
          this.curshape = this.newShape(this.pointsFromEv(ev));
        });
        this.canvas.onmouseup = bind(this, function(ev) {
          this.shapes.push(this.curshape);
          this.curshape = null;
        });
        this.canvas.onmousemove = bind(this, function(ev) {
          if (this.curshape) {
            this.nextPoint(this.curshape, this.pointsFromEv(ev));
          }
        });

        this.resizeTimer = null;
        window.onresize = bind(this, function() {
          // Resize later
          clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(bind(this, this.resizeCanvas), 100);
        });
        window.onscroll = bind(this, this.redraw);
        this.resizeCanvas();
      }

      // Point transformation functions
      // Establish a new coordinate system. (0, 0) is at the top MIDDLE of
      // the page, +x is right and -x is left.
      // This accomodates pages that have fixed-width or centered layouts.
      // todo: actually I would really like this to be relative to either
      // the left of the content or the middle of the page.
      Goggles.prototype.transform = function(p) {
        // Given an absolute point, return the point's position on the screen
        return [
          p[0]-window.scrollX + (this.canvas.width/2),
          p[1]-window.scrollY
        ];
      };
      Goggles.prototype.untransform = function(p) {
        // Given an point wrt the screen, return the point's absolute position
        return [
          p[0]+window.scrollX - (this.canvas.width/2),
          p[1]+window.scrollY
        ];
      };

      // Drawing functions
      Goggles.prototype.drawShape = function(ctx, shape) {
        // Draw a given shape if it is in view.
//      if ((p.x + shape.s) > 0 &&
//          (p.y + shape.s) > 0 &&
//          (p.x - shape.s) < canvas.width &&
//          (p.y - shape.s) < canvas.height) {
          ctx.strokeStyle = "rgba("+shape.r+","+shape.g+","+shape.b+","+shape.a+")";
          ctx.lineWidth = shape.t;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo.apply(ctx, this.transform(shape.p[0]));
          for (var i=0,l=shape.p.length; i<l; i++) {
            ctx.lineTo.apply(ctx, this.transform(shape.p[i]));
          }
          ctx.stroke();
//       }
      };

      Goggles.prototype.redraw = function() {
        // Redraw entire canvas
        var ctx = this.ctx;
        // clear
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (var i=0,l=this.shapes.length; i<l; i++) {
          var shape = this.shapes[i];
          this.drawShape(ctx, shape);
        }

      };

      // Event handling
      Goggles.prototype.pointsFromEv = function(ev) {
        if ('clientX' in ev) { // Firefox
          return [ev.clientX, ev.clientY];
        } else if ('offsetX' in ev) { // Opera
          return [ev.offsetX, ev.offsetY];
        }
      };

      Goggles.prototype.newShape = function(point) {
        // Create and return a new shape.
        var p = {x: this.untransform(point)[0],
                 y: this.untransform(point)[1]},
        shape = {
          p: [],
          t: 5,
          r:0,g:0,b:0,a:1
        };
        return shape;
      };
      Goggles.prototype.nextPoint = function(shape, point) {
        var abspoint = this.untransform(point),
            absprev = shape.p[shape.p.length-1],
            ctx = this.canvas.getContext('2d');
        if (absprev) {
          var relprev = this.transform(absprev||[0,0]);
          // draws part of the shape
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
      };


      //////// INIT
      Goggles.prototype.resizeCanvas = function() {
        // Fix the canvas when resized
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.redraw();
      };


      window.goggles = new Goggles();

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
