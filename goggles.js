/*jslint bitwise:false */
function activateGoggles() {
jQuery.noConflict();
(function($){ // <- hm, maybe not the best way of passing jquery in
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
  function intersect(p1, p2,  p3, p4) {
    // Given two lines (four endponits a1-a2 and b1-b2), return 'true' if they
    // intersect and 'false' if they do not.
    //
    // This function is pure magic. I did not develop it, see
    // http://web.archive.org/web/20071021153914/http://math.niu.edu/~rusin/known-math/95/line_segs
    //
    // from the above source:
    // The sign of the determinant
    //
    //                   | x1 y1 1 |
    // det(P1, P2, P3) = | x2 y2 1 |
    //                   | x3 y3 1 |
    //
    // identifies which side (e.g., north or south) of (extended) line 1 contains
    // P3.
    var det123 = (p2[0]-p1[0]) * (p3[1]-p1[1])-(p3[0]-p1[0]) * (p2[1]-p1[1]),
        det124 = (p2[0]-p1[0]) * (p4[1]-p1[1])-(p4[0]-p1[0]) * (p2[1]-p1[1]),
        det341 = (p3[0]-p1[0]) * (p4[1]-p1[1])-(p4[0]-p1[0]) * (p3[1]-p1[1]),
        det342 = det123 - det124 + det341;
      if (det123===0 || det124===0 || det341===0 || det342===0) {
        return undefined;
      }
      if (det123*det124<0 && det341*det342<0) {
        // if they have opposite signs
        return true;
      }
      return false;
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
  function Picker(onPickColor, onExit) {
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

    var exitButton=$("<div>").text("exit").click(onExit).appendTo(this.jq);
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
  Shape.fromJSON = function(shape) {
    // Convert an array of shapes to real shapes.
    return new Shape(shape.t, shape.r,shape.g,shape.b,shape.a, shape.p);
  };
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
  Shape.prototype.lineIntersects = function(p1, p2) {
    // Return true if the line from p1 to p2 intersects any line in this shape
    for (var i=0,l=this.p.length-1; i<l; i++) {
      var p3=this.p[i], p4=this.p[i+1];
      if (intersect(p1, p2, p3, p4)) {
        return true;
      }
    }
    return false;
  };
  Shape.prototype.equalTo = function(other) {
    // Pointwise comparison
    if (other.p.length == this.p.length) {
      // Each point is equal?
      for (var i=0,l=this.p.length; i<l; i++) {
        if (this.p[i][0] != other.p[i][0] || this.p[i][1] != other.p[i][1]) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
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
    this.serverUrl = ajaxroot;//+"?callback=?";

    this.ctx = this.canvas.getContext('2d');

    this.shapes = null;
    // the list of shapes to draw.

    // used to find out whether we've stopped or not
    this.active = true;

    this.historyStream = null;

    // Center coordinate
    // Guess at where the text probably is
    this.centerCoord = 0;

    // Color picker
    this.curColor = {r:0,g:0,b:0};
    this.picker = new Picker(bind(this,function(color){
        this.curColor = color;
      }), bind(this,function(){this.stop(function(){});}));

    // Events
    this.canvas.oncontextmenu = function(){ return false; };
    this.canvas.onmousedown = bind(this, function(ev) {
        if (ev.button & 2) {
          this.beginErasing(ev);
        } else {
          this.beginDrawing(ev);
        }
        return false;
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
    
    // And connect
    this.connect(bind(this, function(){
        this.picker.show();
      }));
  }
  Goggles.prototype.stop = function(cb) {
    // Destroy a goggles object with optional callback
    this.active = false;
    this.picker.del();
    $(this.canvas).fadeOut('fast', bind(this, function() {
        window.onresize = null;
        window.onscroll = null;
        if (this.historyStream) {
          this.historyStream.stop();
        }
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
      ($("#content").offset()|| {left:0}).left ||

      // hackernews
      ($("body>center>table").offset()||{left: 0}).left ||
      // table-based layouts
      ($("body>table").offset()||{left: 0}).left ||

      // gogole results pages
      ($("#center_col").offset()||{left:0}).left ||

      (this.canvas.width/2)
    );
  };
  Goggles.prototype.beginErasing = function(ev) {
    var mdhandler = this.canvas.onmousedown;
    if (this.shapes !== null) {
      // Erase
      var curpoint = this.untransform(pointsFromEv(ev));
      this.canvas.onmousedown = null;
      this.canvas.onmouseup = bind(this, function(ev) {
          this.canvas.onmousemove = null;
          this.canvas.onmouseup = null;
          this.canvas.onmousedown = bind(this, mdhandler);
      });
      this.canvas.onmousemove = bind(this, function(ev) {
          var newpoint = this.untransform(pointsFromEv(ev));
          var shapeToRemove = null;
          this.shapes.map(function(shape){
              if (shape.lineIntersects(curpoint, newpoint)) {
                shapeToRemove = shape;
              }
            });
          if (shapeToRemove) {
            this.sendDeleteShape(shapeToRemove);
            this.shapes.splice(this.shapes.indexOf(shapeToRemove), 1);
            this.redraw();
          }
          curpoint = newpoint;
      });
    }
  };
  Goggles.prototype.beginDrawing = function(ev){
    var mdhandler = this.canvas.onmousedown;
    if (this.shapes !== null) {
      var curshape = new Shape(5, this.curColor.r,this.curColor.g,this.curColor.b,1);
      this.canvas.onmousedown = null;
      this.canvas.onmouseup = bind(this, function(ev) {
          if (curshape.p.length>=2) {
            this.sendShape(curshape);
          }
          this.canvas.onmousemove = null;
          this.canvas.onmouseup = null;
          this.canvas.onmousedown = bind(this, mdhandler);
      });
      this.canvas.onmousemove = bind(this, function(ev) {
          curshape.appendPoint(this.untransform(pointsFromEv(ev)));
          curshape.drawLast(this.ctx);
      });
    }
  };
  Goggles.prototype.deleteShape = function(shape) {
    // Delete the shape given by 'shape'
    // Note that the shapes are not referentially identical
    for (var i=0,l=this.shapes.length; i<l; i++) {
      if (shape.equalTo(this.shapes[i])) {
        this.shapes.splice(i, 1);
        break;
      }
    }
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
  function ajaxRequest(url, data, cb) {
    // just like jQuery.getJSON but unlike jquery, this handles timeouts in a sane way.
    return $.ajax({
      url: url,
      //dataType: 'json',
      dataType: 'jsonp',
      jsonp: 'jsonp',
      data: data,
      success:
        function(data, textStatus) {
          if (typeof data == 'object' && 'exception' in data) {
            alert("An error appears: " + data.exception);
          } else {
            cb(data, textStatus);
          }
        },
      error:
        function(xhr, e, exception) {
          if (e == 'timeout') {
            ajaxRequest(url, data, cb);
          } else {
            //alert("Network error: " + e);
          }
        }
    });
  }
  function StreamingHistory(url, data, startTime, cb) {
    // This object will run a callback when something on the server changes.
    // Give it a URL to ping and a callback to execute whenever that
    // happens and it'll go on its way. Whenever the server does something,
    // the callback will run with the server's response. This is done in such
    // a way so you won't ever skip history you missed.
    // See: history.js
    this.cb = cb;
    this.url = url;
    this.data = data;
    this.time = startTime;

    var self = this;
    this.nextHist();
  }
  StreamingHistory.prototype.nextHist = function() {
    // Carry out the next action in the history, calling callback if we get
    // anything.
    var self = this;
    this.data.stream = this.time;
    this.xhr = ajaxRequest(this.url, this.data,
      function (actions) {
        for (var i = 0, l = actions.length; i < l; i++) {
          self.cb(actions[i]);
          self.time++;
        }
        self.nextHist();
      });
  };
  StreamingHistory.prototype.stop = function() {
    // Stop current request and stop streaming from the server.
    // TODO: this doesn't actually work because JSONP requests are nothing more
    // than adding <script> tags at the end of the document which are loaded and
    // executed serially. :<
    if (this.xhr !== undefined) {
      this.xhr.abort();
    }
  };

  function serializePoints(points){
    // return the points in a suitable format for the server
    // [[1,2],[3,4]] => "1,2;3,4"
    return points.map(function(point){
        return point[0]+","+point[1];
      }).join(';');
  }
  Goggles.prototype.connect = function(cb) {
    // Initial connection from the server.
    cb = cb || function(){};
    var self = this;
    ajaxRequest(this.serverUrl, {
        page: this.url
      }, function(json) {
        if (json.err) {
          alert(json.err);
          return self.stop(function(){});
        }
        if (self.active) {
          self.shapes = json.shapes.map(Shape.fromJSON);
          self.redraw();
          cb();
          self.historyStream = new StreamingHistory(self.serverUrl, {page: self.url},
            json.nextUpdate,
            function(event) {
              if (event.add_shape) {
                self.shapes.push(Shape.fromJSON(event.add_shape));
                self.redraw();
              } else if (event.delete_shape) {
                self.deleteShape(Shape.fromJSON(event.delete_shape));
                self.redraw();
              }
            });
        }
      });
  };
  Goggles.prototype.sendShape = function(shape) {
    var self = this;
    ajaxRequest(this.serverUrl, {
        page: this.url, add: 't',
        r: shape.r, g:shape.g, b:shape.b, a:shape.a,t:shape.t,
        p:serializePoints(shape.p)},
      function(data){
        if (data && data.err) {
          alert("There was a problem sending the shapes to the server.");
          self.stop(function(){});
        }
      });
  };
  Goggles.prototype.sendDeleteShape = function(shape) {
    var self = this;
    ajaxRequest(this.serverUrl, {
        page: this.url, del: 't',
        r: shape.r, g:shape.g, b:shape.b, a:shape.a,t:shape.t,
        p:serializePoints(shape.p)},
      function(data){
        if (data && data.err) {
          alert("There was a problem deleting the shape.");
          self.stop(function(){});
        }
      });
  };

  window.goggles = new Goggles(window.GOGGLE_SERVER);

})(jQuery);}

if (typeof jQuery == 'undefined') {
  var jQ = document.createElement('script');
  jQ.type = 'text/javascript';
  jQ.onload=activateGoggles;
  jQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
  document.body.appendChild(jQ);
} else {
  activateGoggles();
}
