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

exports.Pagestore = Pagestore;
