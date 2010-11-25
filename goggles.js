function activateGoggles() {
  (function($){
      if (window.goggles && window.goggles.active) {
        window.goggles.stop(function(){}); window.goggles = null; return;
      }

      // Utility functions
      function bind(bindee, action) {
        return function() {
          return action.apply(bindee, Array.prototype.slice.call(arguments));
        };
      }
      function pointsFromEv(ev) {
        // given an event object, return the point's XY coordinates relative to
        // the screen
        if ('clientX' in ev) { // Firefox
          return [ev.clientX, ev.clientY];
        } else if ('offsetX' in ev) { // Opera
          return [ev.offsetX, ev.offsetY];
        }
      }
      function getUrl() {
        // return a unique URL for this page
        return document.location.protocol+"//"+document.location.host+"/"+document.location.pathname;
      }

      // Picker widget
      function hex2rgb(hex) {
        if (hex.length==4) {
          return {r: parseInt(hex.substr(1,1),16)*17,
                  g: parseInt(hex.substr(2,1),16)*17,
                  b: parseInt(hex.substr(3,1),16)*17};
        } else if (hex.length==7) {
          return {r: parseInt(hex.substr(1,2),16),
                  g: parseInt(hex.substr(3,2),16),
                  b: parseInt(hex.substr(5,2),16)};
        } else {
          return {r:0,g:0,b:0};
        }
      }
      function Picker(onPickColor) {
        var self = this;
        this.jq = $("<div>").css({
          position: "fixed",
          cursor: 'pointer',
          "z-index": "100001",
          border: "solid 1px #000",
          top: "0",
          left: "0"
        });
        var chosenColor = $();
        var colors = ["#000", "#fff", "#e50", "#fa0", "#1ba", "#e07", "#ab0"]
          .map(function(color) {
            var colorjq = $("<div>").css({"background-color": color,
                                          'color': (color=="#000"?"#fff":"#000"),
                                          'line-height': '64px',
                                          'font-size': '300%',
                                          'text-align': 'center',
                                          width: 32, height: 64});
            colorjq.click(function(){
                if (colorjq == chosenColor) { return; }
                onPickColor(hex2rgb(color));
                chosenColor.text("");
                chosenColor = colorjq;
                colorjq.html("&bull;");
              });
            colorjq.appendTo(self.jq);
            return colorjq;
          });
        colors[0].click();
      }
      Picker.prototype.del = function() {
        this.jq.fadeOut('fast', bind(this,function(){this.jq.remove();}));
      };
      Picker.prototype.show = function() {
        this.jq.hide().appendTo($("body")).slideDown('medium');
      };

      // SHAPES
      function Shape(thickness, r,g,b,a, points) {
        // Takes a position, thickness, and rgba colors
        // Each shape looks like this:
        // {p: [ [x,y], [x,y], [x,y], ...], points
        //  t: 5                            thickness
        //  r: 250, g: 200, b: 125, a: 0.5  color
        // }
        this.t = thickness;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.p = points||[];
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
      Shape.prototype.boundingBox = function() {
        // return the bounding box
        return {
          left: Math.min.apply(null, this.p.map(function(point){return point[0];})),
          right: Math.max.apply(null, this.p.map(function(point){return point[0];})),
          top: Math.min.apply(null, this.p.map(function(point){return point[1];})),
          bottom: Math.max.apply(null, this.p.map(function(point){return point[1];}))
        };
      };

      // GOGGLES
      function Goggles(ajaxroot) {
        // Here is our goggles object.

        this.canvas = $("<canvas>").css({
          position: "fixed",
          "z-index": "100000",
          top: "0",
          left: "0"
        }).appendTo(document.body)[0];

        this.url = getUrl();
        this.serverUrl = ajaxroot+"?callback=?";

        this.ctx = this.canvas.getContext('2d');

        this.shapes = null;
        // the list of shapes to draw.

        // used to find out whether we've stopped or not
        this.active = true;

        // so we know when to redraw
        this.lastUpdate = null;
        this.updateTimer = null;
        this.update(bind(this,function(){
            this.updateTimer = setInterval(bind(this, this.update), 10000);
            this.picker.show();
          }));

        // Center coordinate
        // Guess at where the text probably is
        this.centerCoord = 0;

        // Color picker
        this.curColor = {r:0,g:0,b:0};
        this.picker = new Picker(bind(this,function(color){
            this.curColor = color;
          }));

        // Events
        this.curshape = null;
        this.canvas.onmousedown = bind(this, function(ev) {
          if (this.shapes !== null) {
            this.curshape = new Shape(5, this.curColor.r,this.curColor.g,this.curColor.b,1);
          }
        });
        this.canvas.onmouseup = bind(this, function(ev) {
          if (this.curshape) {
            if (this.curshape.p.length) {
              // todo: the server will send us the shape on its update
              //this.shapes.push(this.curshape);
              this.sendShape(this.curshape);
            }
            this.curshape = null;
          }
        });
        this.canvas.onmousemove = bind(this, function(ev) {
          if (this.curshape) {
            this.curshape.appendPoint(
              this.untransform(pointsFromEv(ev)));
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
        //this.update();
      }
      Goggles.prototype.stop = function(cb) {
        // Destroy a goggles object with optional callback
        this.active = false;
        this.picker.del();
        $(this.canvas).fadeOut('fast', bind(this, function() {
            window.onresize = null;
            window.onscroll = null;
            clearInterval(this.updateTimer);
            clearTimeout(this.resizeTimer);
            $(this.canvas).remove();
            cb();
          }));
      };
      Goggles.prototype.transform = function(p) {
        // Point transformation functions
        // Establish a new coordinate system. (0, 0) is at the top MIDDLE of
        // the page, +x is right and -x is left.
        // This accomodates pages that have fixed-width or centered layouts.
        // todo: actually I would really like this to be relative to either
        // the left of the content or the middle of the page.
        //
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

      // Drawing functions
      Goggles.prototype.redraw = function() {
        // Redraw entire canvas
        if (this.shapes === null) {
          this.drawLoading();
        } else {
          var ctx = this.ctx;
          // clear
          this.resetCanvasXform();
          for (var i=0,l=this.shapes.length; i<l; i++) {
            var bb = this.shapes[i].boundingBox();
            // clip invisible shapes
            if (bb.right - window.scrollX + this.centerCoord > 0 &&
                bb.left - window.scrollX + this.centerCoord < this.canvas.width &&
                bb.bottom - window.scrollY > 0 &&
                bb.top - window.scrollY < this.canvas.height) {
              this.shapes[i].draw(ctx);
            }
          }
        }
      };
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

      // Loading... screen
      Goggles.prototype.drawLoading = function() {
        this.ctx.setTransform(1,0,
                              0,1,  0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(128,128,128,0.2)";
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
      };

      // AJAX functions
      function unserializeShapeArray(shapes) {
        if (typeof shapes !== 'undefined') {
          return shapes.map(function(s){
              return new Shape(s.t, s.r,s.g,s.b,s.a, s.p);
            });
        }
      }
      function serializePoints(points){
        // return the points in a suitable format for the server
        return points.map(function(point){
            return point[0]+","+point[1];
          }).join(';');
      }
      Goggles.prototype.update = function(cb) {
        // update informations from the server
        cb = cb || function(){};
        var self = this;
        $.getJSON(this.serverUrl, {
            page: this.url
          }, function(json) {
            if (json.err) {
              alert(json.err);
              self.stop(function(){});
            } else {
              console.log(json);
              if (self.active && self.lastUpdate != json.lastUpdate) {
                self.lastUpdate = json.lastUpdate;
                if (!self.curshape) {
                  self.shapes = unserializeShapeArray(json.shapes);
                  self.redraw();
                }
                cb();
              }
            }
          });
      };
      Goggles.prototype.sendShape = function(shape) {
        var self = this;
        $.getJSON(this.serverUrl, {
            page: this.url, add: 't',
            r: shape.r, g:shape.g, b:shape.b, a:shape.a,t:shape.t,
            p:serializePoints(shape.p)},
          function(data){
            if (data && data.err) {
              alert("There was a problem sending the shapes to the server.");
              console.log(data);
              self.stop(function(){});
            }
          });
      };

      window.goggles = new Goggles(window.GOGGLE_SERVER);

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
