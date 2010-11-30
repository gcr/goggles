/*jslint bitwise:false */
/*globals Goggles getUrl picker bind Picker Shape pointsFromEv */

// Handles drawing shapes with the MOUSE.

Goggles.prototype.beginErasing = function(ev) {
  // Begin erasing shapes until the mouse button is released.
  // TODO: work properly by splitting shapes up into points that intersect
  // circles or not.
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
        var newpoint = this.untransform(pointsFromEv(ev)),
            removedAShape = false;
        this.shapes.map(bind(this, function(shape){
            if (shape.lineIntersects(curpoint, newpoint)) {
              // delete them
              // todo: we don't want to  KEEP the shape but at the same time we
              // also don't want to DISCARD the shape before we know it's been
              // erased.
              // so for now we'll just be sneaky! >:D
              //this.shapes.splice(this.shapes.indexOf(shape), 1);
              //if (!shape.erased) {
                this.sendDeleteShape(shape);
              //}
              //shape.erased = true;
            }
            if (removedAShape) {
              this.redraw();
            }
          }));
        curpoint = newpoint;
    });
  }
};

Goggles.prototype.beginDrawing = function(ev){
  // Begin drawing a shape until the mouse button is released
  var mdhandler = this.canvas.onmousedown,
      self = this,
      curshape;
  function makeShape() {
    curshape = new Shape(5, self.curColor.r,self.curColor.g,self.curColor.b,1);
  }
  function finishShape() {
    if (curshape.p.length>=2) {
      self.sendShape(curshape);
    }
  }
  if (this.shapes !== null) {
    makeShape();
    curshape.appendPoint(this.untransform(pointsFromEv(ev)));
    this.canvas.onmousedown = null;
    this.canvas.onmouseup = bind(this, function(ev) {
        finishShape(curshape);
        this.canvas.onmousemove = null;
        this.canvas.onmouseup = null;
        this.canvas.onmousedown = bind(this, mdhandler);
    });
    this.canvas.onmousemove = bind(this, function(ev) {
        curshape.appendPoint(this.untransform(pointsFromEv(ev)));
        if (curshape.p.length >= 250) {
          finishShape(curshape);
          makeShape();
          curshape.appendPoint(this.untransform(pointsFromEv(ev)));
        }
        curshape.drawLast(this.ctx);
    });
  }
};
