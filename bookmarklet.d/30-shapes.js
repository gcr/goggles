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

function pointNear(p, radius,  a,b) {
  /*
   * Given a point p, a "radius", and two more points a and b, return whether
   * the point p is within radius of line ab.
   *
   * We'll use a bounding box approach here.
   *
   *    +---+---------------------+--+
   *    |   | radius              |  |
   *    +---+ - - - - - - - - - - +--+
   *    |   |                  .-'|b |
   *    |         +         ,-'      |
   *    |   |    p \     ,-'      |  |
   *    |           \ ,-'            |
   *    |   |      ,-"            |  |
   *    |       ,-'                  |
   *    |   |,-'                  |  |
   *    +---+ - - - - - - - - - - +--+
   *    |   | a                   |  |
   *    +---+---------------------+--+
   *
   * Points A and B form an "inner" bounding box (dashed line). This is padded
   * by 'radius' units on all sides to form an "outer" bounding box (solid
   * line). If p lies outside of this outer bounding box, there is no
   * possibility of a collision. If p lies inside the bounding box, then a
   * standard point-line-distance test is used.
   *
   * This estimate will give false positives for the two corners nearest to b
   * and a where p lies inside the square but just outside the quarter-circle.
   */
  var x=p[0],
      y=p[1];
    if (x < Math.min(a[0], b[0])-radius ||    // left
        x > Math.max(a[0], b[0])+radius ||    // right
        y < Math.min(a[1], b[1])-radius ||    // top
        y > Math.max(a[1], b[1])+radius) {    // bottom
      // p lies outside the bounding box for this line segment
      return false;
    }

    var denominator = Math.sqrt( (b[0]-a[0])*(b[0]-a[0]) + (b[1]-a[1])*(b[1]-a[1]) );
    if (denominator==0) { return true; }
    // see http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
    return (Math.abs( (b[0]-a[0])*(a[1]-p[1]) - (a[0]-p[0])*(b[1]-a[1]) ) /
            denominator) <= radius;

}

// SHAPES
function Shape(thickness, r,g,b,a, points, id) {
  // Takes a position, thickness, and rgba colors
  // Each shape looks like this:
  // {p: [ [x,y], [x,y], [x,y], ...], points
  //  t: 5                            thickness
  //  r: 250, g: 200, b: 125, a: 0.5  color
  //  id: 15                          shape ID (for fast deletions)
  // }
  this.t = thickness;
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.p = points||[];
  this.id = (typeof id == 'undefined')? null : id;
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
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo.apply(ctx, a);
    ctx.lineTo.apply(ctx, b);
    ctx.stroke();
  }
};
Shape.prototype.draw = function(ctx) {
  // Draw a given shape if it is in view.
// this prematurely optimized bounding box test is done elsewhere, I think
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
  if (!(this.bbox) || this.npoints != this.p.length) {
    this.npoints = this.p.length;
    this.bbox = {
      left: Math.min.apply(null, this.p.map(function(point){return point[0];})),
      right: Math.max.apply(null, this.p.map(function(point){return point[0];})),
      top: Math.min.apply(null, this.p.map(function(point){return point[1];})),
      bottom: Math.max.apply(null, this.p.map(function(point){return point[1];}))
    };
  }
  return this.bbox;
};
Shape.prototype.pointIntersects = function(p, radius) {
  // Return true if the point p intersects any line in this shape with given
  // radius.
  radius+=this.t;
  var bb = this.boundingBox();
  if (p[0] < bb.left-radius ||
      p[0] > bb.right+radius ||
      p[1] < bb.top-radius ||
      p[1] > bb.bottom+radius) {
    // quick bounding box check
    return false;
  }
  for (var i=0,l=this.p.length-1; i<l; i++) {
    var a=this.p[i], b=this.p[i+1];
    //console.log("is ",p," near",a,b," with radius ",radius,"?");
    if (pointNear(p, radius, a, b)) {
      //console.log("yes, should remove");
      return true;
    }
  }
  return false;
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
Shape.prototype.pointwiseEqualTo = function(other) {
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

function DouglasPeucker(pointList, threshDist, start, end) {
  // recursively simplify the points in pointList from starting index to ending
  // index
  //

  //console.log("Starting at "+start+" to "+end);

  // if they're next to each other
  if (Math.abs(end-start) <= 1) {
    return [pointList[start]];
  }
  // else, return a list of simplified points
  // if the furthest vertex is more than some threshhold distance away from the
  // line defined by pointList[start] -- pointList[end], recurse; otherwise,
  // just use that line.
  var maxDistance = 0, maxPointIndex=0,
      a = pointList[start], b = pointList[end];
  for (var i=start+1; i<end; i++) {
    var p = pointList[i],
        thisDistance = Math.abs( (b[0]-a[0])*(a[1]-p[1]) - (a[0]-p[0])*(b[1]-a[1]) ) /
                       Math.sqrt( (b[0]-a[0])*(b[0]-a[0]) + (b[1]-a[1])*(b[1]-a[1]) );
    if (thisDistance > maxDistance) {
      maxDistance = thisDistance;
      maxPointIndex = i;
    }
  }

  if (maxDistance > threshDist) {
    // too big! recurse!
    //console.log(maxDistance+" is too big, recursing");
    return DouglasPeucker(pointList,threshDist,start,maxPointIndex).concat(
           DouglasPeucker(pointList,threshDist,maxPointIndex,end));
  } else {
    //console.log(maxDistance+" is enough");
    return [pointList[start]];
  }
}

Shape.prototype.simplifyInPlace = function(){
  // TODO: convert shape to simpler representation
  for (var i=0,l=this.p.length; i<l; i++) {
    this.p[i][0] = parseInt(this.p[i][0],10);
    this.p[i][1] = parseInt(this.p[i][1],10);
  }

  this.p = DouglasPeucker(this.p, 3, 0, this.p.length-1).concat([this.p[this.p.length-1]]);
};

// we serialize our points to something similar to base64
// major changes: we use _ instead of / and - instead of + as the last
// characters (it's being sent in a query string)
var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function numToB64(num) {
  // return a 3-digit base64 number that represents num
  num = num + 131072; // this bias is 64**3 / 2 and allows us to represent negative numbers
  var result = "";
  for (var i = 0; i < 3; i++) {
    result = b64[ num%64 ] + result;
    num = parseInt(num / 64,10);
  }
  return result;
}
function b64ToNum(b) {
  var result = 0;
  for (var i=0,l=b.length; i<l; i++) {
    var chr = b64.indexOf(b[i]);
    if (chr == -1) {
      throw new Error("contained a char that wasn't our base64");
    }
    result *= 64;
    result += chr;
  }
  return result - 131072;
}
function b64ToPoints(b) {
  if ((b.length % 6) !== 0) {
    throw new Error("invalid point length");
  }
  var points = [];
  for (var i=0,l=b.length; i<l; i+=6) {
    var x = b64ToNum(b.substring(i,   i+3)),
        y = b64ToNum(b.substring(i+3, i+6));
      points.push( [x,y] );
  }
  return points;
}

Shape.prototype.serializePoints = function(){
  var result = "";
  for (var i=0,l=this.p.length; i<l; i++) {
    result += numToB64(this.p[i][0])+numToB64(this.p[i][1]);
  }
  return result;
};
Shape.fromJSON = function(shape) {
  // Convert an array of shapes to real shapes.
  return new Shape(shape.t, shape.r,shape.g,shape.b,shape.a, b64ToPoints(shape.p), shape.id);
};
