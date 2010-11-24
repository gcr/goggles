function activateGoggles() {
  (function($){
      if (window.goggles) { return window.goggles.stop(function(){window.goggles = null;}); }

      function bind(bindee, action) {
        return function() {
          return action.apply(bindee, Array.prototype.slice.call(arguments));
        };
      }

      // SHAPES
      function Shape(t, r,g,b,a) {
        // Each shape looks like this:
        // {p: [ [x,y], [x,y], [x,y], ...], points
        //  t: 5                            thickness
        //  r: 250, g: 200, b: 125, a: 0.5  color
        // }
        // give it a position, thickness, and rgba colors
        this.t = t;
        this.r=r;
        this.g=g;
        this.b=b;
        this.a=a;
        this.p = [];
      }
      Shape.prototype.appendPoint = function(point) {
        // Append a point to this shape.
        this.p.push(
          [Math.round(point[0]*10)/10, Math.round(point[1]*10)/10]
        );
      };
      Shape.prototype.drawLast = function(ctx) {
        // Given a canvas, draw the last line of the shape
        if (this.p.length >= 2) {
          var a = this.p[this.p.length-2],
              b = this.p[this.p.length-1];
          // draws part of the shape
          ctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
          ctx.lineWidth = this.t;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo.apply(ctx, a);
          ctx.lineTo.apply(ctx, b);
          ctx.stroke();
        }
      };
      Shape.prototype.draw = function(ctx) {
        // Draw a given shape if it is in view.
//      if ((p.x + shape.s) > 0 &&
//          (p.y + shape.s) > 0 &&
//          (p.x - shape.s) < canvas.width &&
//          (p.y - shape.s) < canvas.height) {
          ctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
          ctx.lineWidth = this.t;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo.apply(ctx, this.p[0]);
          for (var i=0,l=this.p.length; i<l; i++) {
            ctx.lineTo.apply(ctx, this.p[i]);
          }
          ctx.stroke();
//       }
      };

      // GOGGLES
      function Goggles() {
        // Here is our goggles object.
        
        this.canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];

        this.ctx = this.canvas.getContext('2d');

        this.shapes = [];
        // the list of shapes to draw.
        this.curshape = null;

        // Center coordinate
        // Guess at where the text probably is
        this.centerCoord = 0;
        this.recalculateCenter();

        // Events
        this.canvas.onmousedown = bind(this, function(ev) {
          this.curshape = new Shape(5, 0,0,0,1);
        });
        this.canvas.onmouseup = bind(this, function(ev) {
          this.shapes.push(this.curshape);
          this.curshape = null;
        });
        this.canvas.onmousemove = bind(this, function(ev) {
          if (this.curshape) {
            this.curshape.appendPoint(
              this.untransform(this.pointsFromEv(ev)));
            this.curshape.drawLast(this.ctx);
          }
        });

        // Window resize and scroll handlers
        this.resizeTimer = null;
        window.onresize = bind(this, function() {
          // Resize later
          clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(bind(this, this.resizeCanvas), 100);
        });
        window.onscroll = bind(this, this.redraw);
        this.resizeCanvas();
      }
      Goggles.prototype.stop = function(cb) {
        // Destroy a goggles object with optional callback
        $(this.canvas).fadeOut('fast', function() {
            window.onresize = null;
            window.onscroll = null;
            clearTimeout(this.resizeTimer);
            $(this.canvas).remove();
            cb();
          });
      };
      // Point transformation functions
      // Establish a new coordinate system. (0, 0) is at the top MIDDLE of
      // the page, +x is right and -x is left.
      // This accomodates pages that have fixed-width or centered layouts.
      // todo: actually I would really like this to be relative to either
      // the left of the content or the middle of the page.
      Goggles.prototype.transform = function(p) {
        // Given an absolute point in our new coordinate system, return the
        // point's position on the screen
        return [
          p[0]-window.scrollX + this.centerCoord,
          p[1]-window.scrollY
        ];
      };
      Goggles.prototype.untransform = function(p) {
        // Given an point wrt the screen, return the point's absolute position
        // wrt our coordinate system
        return [
          p[0]+window.scrollX - this.centerCoord,
          p[1]+window.scrollY
        ];
      };

      // Drawing functions
      Goggles.prototype.redraw = function() {
        // Redraw entire canvas
        var ctx = this.ctx;
        // clear
        this.resetCanvasXform();

        for (var i=0,l=this.shapes.length; i<l; i++) {
          this.shapes[i].draw(ctx);
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


      //////// INIT
      Goggles.prototype.resetCanvasXform = function() {
        this.ctx.setTransform(1,0,
                              0,1,  0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.setTransform(1,0,
                              0,1,
          this.centerCoord-window.scrollX,
          -window.scrollY);
      };
      Goggles.prototype.resizeCanvas = function() {
        // Fix the canvas when resized
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.recalculateCenter();
        this.redraw();
      };

      Goggles.prototype.recalculateCenter = function() {
        // this calculates what X-coordinate will be the 'focus' of our web
        // page.
        //
        // essentially, we want our x=0 coordinate to be the left edge of the
        // content. this works reasonably well in practice except for
        // dynamically generated things and line wrapping.

        this.centerCoord = (
          ($("#header").offset() || {left:0}).left ||
          ($(".header").offset() || {left:0}).left ||
          ($(".inner").offset()  || {left:0}).left ||
          ($(".content").offset()|| {left:0}).left ||

          // hackernews
          ($("body>center>table").offset()||{left: 0}).left ||
          // table-based layouts
          ($("body>table").offset()||{left: 0}).left ||

          // gogole results pages
          ($("#center_col").offset()||{left:0}).left ||
          
          (this.canvas.width/2)
        );
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
