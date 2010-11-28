/*jslint bitwise:false */
/*globals getUrl picker bind Picker Shape pointsFromEv */
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
    }));

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
Goggles.prototype.stop = function() {
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
