/*jslint bitwise:false */
/*globals getUrl picker bind Picker Shape pointsFromEv */
// GOGGLES
function Goggles(ajaxroot) {
  // Here is our goggles object.

  this.canvas = $("<canvas>").css({
    position: "fixed",
    "z-index": "100000",
    top: "0",
    left: "0",
    "pointer-events": "auto"
  }).appendTo(document.body)[0];

  this.url = getUrl();
  this.serverUrl = ajaxroot;//+"?callback=?";

  this.ctx = this.canvas.getContext('2d');

  this.shapes = null;
  // the list of shapes to draw.

  this.waitingShapes = [];
  // the list of shapes we've sent to the server but haven't heard back about.

  this.active = true;
  // used to find out whether we've stopped or not

  this.historyStream = null;

  // Center coordinate
  // Guess at where the text probably is
  this.centerCoord = 0;

  // Color picker
  this.curColor = {r:0,g:0,b:0};
  this.curBrushSize = 5;
  this.picker = new Picker(bind(this,function(color){
      this.curColor = color;
    }), bind(this,function(size){
      this.curBrushSize = size;
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
  window.onresize = null;
  window.onscroll = null;
  if (this.historyStream) {
    this.historyStream.stop();
  }
  clearTimeout(this.resizeTimer);
  $(this.canvas).fadeOut('fast', bind(this, function() {
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

