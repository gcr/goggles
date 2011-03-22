// pagestore.js
//
// We keep pages and dispatch methods to them.
var Keystore = require('./keystore').Keystore,
    Page = require('./page').Page,
    CacheStore = require('./cachestore').CacheStore;

function Pagestore(dir, emptyCbTimeout) {
  // Pagestore keeps info on pages and current visitors.
  this.ks = new Keystore(dir);
  // we want to keep just one copy of a keystore and pass it to our pages...
  this.cache = new CacheStore(5*emptyCbTimeout);
  this.emptyCbTimeout = emptyCbTimeout;
}

Pagestore.prototype.get = function(key) {
  // returns a page from the cache
  var page = this.cache.get(key);
  if (!page) {
    page = new Page(this.ks, key, this.emptyCbTimeout);
    this.cache.set(key, page);
  }
  return page;
};

// stateless operations
Pagestore.prototype.getPageInfo = function(key, cb) {
  // Retrieves informations about the page indexed by 'key' and passes it into
  // cb
  return this.get(key).JSONize(cb);
};

// things that modifiy state
Pagestore.prototype.deleteShapeFromPage = function(key, shapeId, cb) {
  return this.get(key).deleteShapeFromPage(shapeId, cb);
};

Pagestore.prototype.addShapeToPage = function(key, shape, cb) {
  return this.get(key).addShapeToPage(shape, cb);
};

Pagestore.prototype.fadeShapes = function(key, diff, cutoffThresh) {
  return this.get(key).fadeShapes(diff, cutoffThresh);
};

// history streaming
Pagestore.prototype.streamPageUpdates = function(key, since, cb) {
  // Stream page updates to clients who ask for a given time.
  return this.get(key).streamPageUpdates(since, cb);
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

Pagestore.prototype.verifyShape = function(points, t, r,g,b,a) {
  // Returns a new shape with given points (p), thickness t, color rgba.
  // TODO: this REALLY REALLY REALLY doesn't belong here! booooo!
  // at least make this a static method for heavens sake!
  try {
    t = t? parseFloat(t):3;
    r = r? parseFloat(r):0;
    g = g? parseFloat(g):0;
    b = b? parseFloat(b):0;
    a = a? parseFloat(a):1;
    // now verify points
    points = b64ToPoints(points);
    if (points.length===0) {
      console.log(new Error("No points").stack);
      return false;
    } else {
      return {t: t, p: points, r:r,g:g,b:b,a:a};
    }
  } catch(e) {
    console.log(e.stack); // wth?
    return false;
  }
};

exports.Pagestore = Pagestore;
