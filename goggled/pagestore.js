// pagestore.js
//
// manages saving shapes on pages and other such happenings.
//
// you can do a few things to a page:
//  - lookup information (also returns history time)
//  - add a shape to a page (also adds an {add_shape: shape} to the history)
//  - stream history updates from the page
//
var Keystore = require('./keystore').Keystore,
    History = require('./history').History;

function unserializepoints(points) {
  // This function turns a string with commas and semicolons into a new one.
  return points.split(';').map(function(point) {
      var p = point.split(',');
      return [parseFloat(p[0]),parseFloat(p[1])];
    });
  // note that obviously this requires more validation than THAT. psh.
}

function Pagestore(dir) {
  // Pagestore keeps info on pages and current visitors.
  this.ks = new Keystore(dir);
  this.histories = [];
}
Pagestore.prototype.getHistory = function(k) {
  // Return the history object associated with key k
  if (!(k in this.histories)) {
    this.histories[k] = new History();
  }
  return this.histories[k];
};
Pagestore.prototype.getPageInfo = function(key, cb) {
  // Retrieves informations about the page indexed by 'key' and passes it into
  // cb
  var self = this;
  this.ks.get(key, function(info) {
      if (info) {
        cb({shapes: info.shapes,
            lastUpdate: self.getHistory(key).time()
          });
      } else {
        cb({first: true,
            shapes: [],
            lastUpdate: 0
          });
      }
    });
};
Pagestore.prototype.addShapeToPage = function(key, shape, cb) {
  // Adds a shape to the page.
  // First, we need to verify things about it.
  var self = this;
  // now that we have everything we need, get the information and assemble 
  this.getPageInfo(key, function(pageInfo) {
      pageInfo.shapes.push(shape);
      pageInfo.lastUpdate++;
      self.ks.set(key, {shapes: pageInfo.shapes}, // only save what we need
        function(err){
          if(err){
            console.log(err.stack);
            cb({err: "The server had a problem saving the shape."});
          } else {
            cb(true);
            console.log(require('util').inspect(self.histories));
            self.getHistory(key).add(
              {add_shape: shape}
            );
          }
        });
    });
};
Pagestore.prototype.streamPageUpdates = function(key, since, cb) {
  // Stream page updates to clients who ask for a given time.
  this.getHistory(key).after(since, cb);
};

Pagestore.prototype.verifyShape = function(points, t, r,g,b,a) {
  // Returns a new shape with given points (p), thickness t, color rgba.
  // TODO: move this elsewhere; it doesn't belong here. It belongs in the view
  // object or something.
  try {
    t = parseFloat(t)||3;
    r = parseFloat(r)||0;
    g = parseFloat(g)||0;
    b = parseFloat(b)||0;
    a = parseFloat(a)||1;
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
