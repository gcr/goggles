// shape.js
//
// much-needed abstraction for a certain shape
//
function Shape(thickness, r,g,b,a, points, id) {
  // Build a new shape
  this.t = thickness;
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;

  this.p = points;

  this.id = id; // I REALLY don't like putting this here.
}
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
Shape.fromParams = function(points, t, r,g,b,a){
  try {
    // Returns a new shape with given points (p), thickness t, color rgba.
    t = t? parseFloat(t):3;
    r = r? parseFloat(r):0;
    g = g? parseFloat(g):0;
    b = b? parseFloat(b):0;
    a = a? parseFloat(a):1;
    // now verify points
    points = b64ToPoints(points);
    if (points.length===0) {
      throw new Error("No points");
    } else {
      return new Shape(t, r,g,b,a, points, 0);
    }
  } catch (e) {
    console.log(e.stack); // wth?
    return false;
  }
};
Shape.fromJSON = function(data){
  // this json is assumed to contain normal points (e.g. it's saved on disk)
  return new Shape(data.t,  data.r,data.g,data.b,data.a, data.p, data.id||0);
};

Shape.prototype.serializePoints = function(){
  var result = "";
  for (var i=0,l=this.p.length; i<l; i++) {
    result += numToB64(this.p[i][0])+numToB64(this.p[i][1]);
  }
  return result;
};

Shape.prototype.toJSON = function(){
  return {
    t: this.t,
    r: this.r,
    g: this.g,
    b: this.b,
    a: this.a,
    p: this.p,
    id: this.id
  };
};
Shape.prototype.toJSONWithSerializedPoints = function(){
  return {
    t: this.t,
    r: this.r,
    g: this.g,
    b: this.b,
    a: this.a,
    p: this.serializePoints(),
    id: this.id
  };
};

exports.Shape = Shape;
