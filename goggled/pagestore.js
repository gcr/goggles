// pagestore.js
//
// manages saving shapes on pages and other such happenings
var Keystore = require('./keystore').Keystore;

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
}
Pagestore.prototype.getPageInfo = function(key, cb) {
  // Retrieves informations about the page indexed by 'key' and passes it into
  // cb
  this.ks.get(key, function(info) {
      if (info) {
        cb({shapes: info.shapes,
            lastUpdate: info.lastUpdate
          });
      } else {
        cb({first: true,
            shapes: [],
            lastUpdate: 0
          });
      }
    });
};
Pagestore.prototype.addShapeToPage = function(key, points, thickness, r, g, b, a, cb) {
  // Adds a shape to the page.
  // First, we need to verify things about it.
  var self = this;
  try {
    var t = parseFloat(thickness)||3;
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
    if (points.length===0) { throw new Error("NO POINTS"); }

    // now that we have everything we need, get the information and assemble 
    this.getPageInfo(key, function(data) {
        data.shapes.push({
            t: t,
            p: points,
            r:r,g:g,b:b,a:a
          });
        data.lastUpdate++;
        self.ks.set(key, data, function(err){
            if(err){
              console.log(err.stack);
              cb({err: "The server had a problem saving the shape."});
            } else {
              cb(true);
            }
          });
      });

  } catch(e) {
    cb({err: "Your shape parameters are invalid"});
    console.log(e.stack);
  }

};

exports.Pagestore = Pagestore;
