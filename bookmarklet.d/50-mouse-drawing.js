/*jslint bitwise:false */
/*globals Goggles getUrl picker bind Picker Shape pointsFromEv */

// Handles drawing shapes with the MOUSE.

Goggles.prototype.beginErasing = function(ev) {
  // Begin erasing shapes until the mouse button is released.
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
        for (var i=0,l=this.shapes.length; i<l; i++) {
          if (this.shapes[i].pointIntersects(newpoint, this.curBrushSize/2) ||
              this.shapes[i].lineIntersects(curpoint, newpoint)) {
            // delete them
            // todo: we don't want to  KEEP the shape but at the same time we
            // also don't want to DISCARD the shape before we know it's been
            // erased.
            // so for now we'll just be sneaky! >:D
            this.sendDeleteShape(this.shapes[i]);
            this.shapes.splice(this.shapes.indexOf(this.shapes[i]), 1);
            i--;
            l--;
            removedAShape = true;
          }
        }
        if (removedAShape) {
          this.redraw();
        }
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
    curshape = new Shape(self.curBrushSize, self.curColor.r,self.curColor.g,self.curColor.b,1);
    self.waitingShapes.push(curshape); // add to our list of shapes we're waiting on
  }
  function finishShape() {
    curshape.simplifyInPlace();
    if (curshape.p.length>=2) {
      self.sendShape(curshape);
    }
    //console.log(curshape);
    //self.redraw();
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
        if (curshape.p.length >= 1000) {
          //curshape.simplifyInPlace();
          finishShape(curshape);
          makeShape();
          curshape.appendPoint(this.untransform(pointsFromEv(ev)));
        }
        curshape.drawLast(this.ctx);
    });
  }
};
