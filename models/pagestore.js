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
Pagestore.prototype.deleteShapeFromPage = function(key, shape, cb) {
  return this.get(key).deleteShapeFromPage(shape, cb);
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

function unserializepoints(points) {
  // This function turns a string with commas and semicolons into a new one.
  return points.split(';').map(function(point) {
      var p = point.split(',');
      return [parseFloat(p[0]),parseFloat(p[1])];
    });
  // note that obviously this requires more validation than THAT. psh.
}


Pagestore.prototype.verifyShape = function(points, t, r,g,b,a) {
  // Returns a new shape with given points (p), thickness t, color rgba.
  // TODO: move this elsewhere; it doesn't belong here. It belongs in the view
  // object or something.
  try {
    t = t? parseFloat(t):3;
    r = r? parseFloat(r):0;
    g = g? parseFloat(g):0;
    b = b? parseFloat(b):0;
    a = a? parseFloat(a):1;
    // now verify points
    points = unserializepoints(points)
      .filter(function(point) {
          if (point instanceof Array) {
            var x=point[0], y=point[1];
            if ((x === 0 || x) && (y===0||y)) {
              return [x, y];
            }
          }
        });
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
