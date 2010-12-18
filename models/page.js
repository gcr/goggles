// page.js
//
// One page that stores informations about itself.
//
// you can do a few things to a page:
//  - lookup information (also returns history time)
//  - add a shape to a page (also adds an {add_shape: shape} to the history)
//  - stream history updates from the page
//
// Each page has an asynchronous lock that ensures that operations that must
// change state happen only one at a time.
//
var History = require('./history').History,
    AsyncLock = require('./async_lock').AsyncLock;

function Page(ks, key, emptyCbTimeout) {
  // Page keeps info on the current page; the keystore and key index us, and
  // emptyCbTimeout is when we ask history to stop.
  this.ks = ks;
  this.key = key;
  this.history = new History(emptyCbTimeout); // this is for streaming updates to clients
  this.lock = new AsyncLock();

  this.info = null;
}

// stateless operations
Page.prototype.get = function(cb) {
  // Ensures that this.info is filled.
  // Then returns it.
  // TODO: when we say pageInfo.shapes, then ensure that that's correctly
  // changed if we don't return pageInfo
  var self = this;
  if (this.info !== null) {
    return cb(this.info);
  } else {
    // no info, have to get it from disk
    this.ks.get(this.key, function(diskInfo) {
        if (diskInfo) {
          // we got info from disk
          self.info = {
            shapes: diskInfo.shapes.map(function(shape, index){
                // Assign each shape an ID if it does not already have one.
                if (typeof shape.id == 'undefined' || shape.id === null) {
                  shape.id = index;
                  diskInfo.nextId = (diskInfo.nextId||index)+1;
                }
                return shape;
              }),
              nextId: diskInfo.nextId
            };
        } else {
          // we have no record of this page... best build a new one. *sigh*
          self.info = {
            shapes: [],
            nextId: 0,
            nextUpdate: self.history.time()
          };
        }
        cb(self.info);
      });
  }
};

Page.prototype.JSONize = function(cb) {
  // eventually call cb with a JSON-representation of ourselves.
  var self = this;
  this.get(function(pageInfo) {
      cb({
          shapes: pageInfo.shapes,
          nextUpdate: self.history.time()
        });
    });
};

// things that modifiy state
Page.prototype.sync = function(cb) {
  // Write the page info to disk and call cb once we finish.
  // Be careful -- this does no locking!
  var self = this;
  self.get(function(pageInfo) {
    // todo: do we really need that get? /really/ ?
    self.ks.set(self.key, {
        shapes: pageInfo.shapes,
        nextId: pageInfo.nextId
      }, cb);
    });
};

Page.prototype.deleteShapeFromPage = function(shapeId, cb) {
  // WARNING WARNING WARNING!
  // ALL CODE PATHS MUST CALL BOTH CB _AND_ UNLOCK! Ensure that any necessary
  // try/catch blocks are in place
  var self = this;
  this.lock.lock(function(unlock){
    // Delete shape from the page.
    self.get(function(pageInfo) {
        // find shape (pointwise comparison)
        var shapes = pageInfo.shapes,
            foundShape = null;
        pageInfo.shapes.forEach(function(shape, id) {
            // todo! keep shapes inside a dictionary
            if (shape.id == shapeId) {
              foundShape = id;
            }
          });
        if (foundShape === null) {
          cb(false);
          unlock();
        } else {
          shapes.splice(foundShape, 1);
          // TODO: FIX THAT
          self.sync(function(err){
            if(err){
              console.log(err.stack);
              cb({err: "The server had a problem deleting the shape."});
              unlock();
            } else {
              cb(true);
              self.history.add(
                {delete_shape: shapeId}
              );
              unlock();
            }
          });
        }
      });
  });
};

Page.prototype.addShapeToPage = function(shape, cb) {
  // WARNING WARNING WARNING!
  // ALL CODE PATHS MUST CALL BOTH CB _AND_ UNLOCK! Ensure that any necessary
  // try/catch blocks are in place
  var self = this;
  this.lock.lock(function(unlock){
    // Adds a shape to the page.
    // First, we need to verify things about it.
    // now that we have everything we need, get the information and assemble 
    self.get(function(pageInfo) {
        if (self.findShapeEquivTo(pageInfo.shapes, shape)) {
          cb(false);
          return unlock();
        }
        shape.id = pageInfo.nextId;
        pageInfo.nextId++;
        pageInfo.shapes.push(shape);
        self.sync(function(err){
            if(err){
              console.log(err.stack);
              cb({err: "The server had a problem saving the shape."});
              unlock();
            } else {
              cb(true);
              self.history.add(
                {add_shape: shape}
              );
              unlock();
            }
          });
      });
  });
};

Page.prototype.fadeShapes = function(diff, cutoffThresh) {
  // TODO! move this elsewhere
  // Fade all shapes on this page
  var self = this;
  this.lock.lock(function(unlock){
    self.get(function(pageInfo) {
        console.log(pageInfo.shapes.length+" shapes");
        var newShapes = pageInfo.shapes
          .map(function(shape){
            shape.a = shape.a - diff;
            return shape;
          })
          .filter(function(shape){
            return shape.a >= cutoffThresh;
          });
        pageInfo.shapes = newShapes;
        self.sync(unlock);
      });
  });
};

// contuniation handling

Page.prototype.streamPageUpdates = function(since, cb) {
  // Stream page updates to clients who ask for a given time.
  this.history.after(since, cb);
};

Page.prototype.findShapeEquivTo = function(haystack, needle) {
  // given a list of shapes (haystack) and a certain shape that's equivalent but
  // not identical to a shape in haystack, return either null or the given
  // shape.
  var pointsEqual = function(point, index) {
          return point[0] == needle.p[index][0] && point[1] == needle.p[index][1];
        };
  for (var i=0,l=haystack.length; i<l; i++) {
    // Look through all the shape and see if we found the one we want
    var galleryshape = haystack[i];
    if (galleryshape.p.length == needle.p.length && galleryshape.p.every(pointsEqual)) {
      return galleryshape;
    }
  }
  return null;
};

exports.Page = Page;
