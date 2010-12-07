// Caching dictionary
//
// Caching dictionaries time out after a while.
// We use them here to keep pages.
//
// Operations: get(k, v), set(k, v)

function CacheStore(timeout) {
  this.timeout = timeout;
  this.data = {};
  this.timers = {};
}

CacheStore.prototype.resetTimeout = function(k) {
  // reset the key's timeout
  var self = this;
  if (this.timers[k]) {
    clearTimeout(this.timers[k]);
  }
  this.timers[k] = setTimeout(function(){
      console.log("Timed out "+k);
      delete self.data[k];
      delete self.timers[k];
    }, this.timeout);
};

CacheStore.prototype.get = function(k) {
  this.resetTimeout(k);
  return this.data[k];
};

CacheStore.prototype.set = function(k, v) {
  this.resetTimeout(k);
  this.data[k] = v;
  return this;
};

exports.CacheStore = CacheStore;
