/*globals Goggles */
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
