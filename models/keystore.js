// keystore.js
//
// a quick git-inspired anti-db hashtable, like memcached
//
// Keystore("dir") returns a keystore object where everything is stored inside
// "dir". (Note! this is expensive)
//
// Keystore.prototype.set("key", value, function callback(error){})
// will store the JSON-serialized value into the string key.
//
// Keystore.prototype.get("key", function callback(data){})
// will JSON-unserialize the object and call callback with either the data or
// undefined.
//
// The database is pretty simple. Just like git, we sha1 the key and store it in
// 01/23456789abcdef; that is, the first two digits of the sha1 is the folder
// and the rest is the file.
//
// Care is taken to ensure only one write/read operation per key will occur at a
// time.
//
// Also note that because objects are stored by sha1 hash, it's impossible to
// get at the keys (if I implemented it right that is ;) )
// This is kinda the point.

var sha1 = require('./sha1').hex_sha1,
    fs = require('fs'),
    path = require('path');

function Keystore(directory) {
  // WARNING! expensive!
  this.dir = directory;
  // initialize subdirs
  for (var i=0; i<256; i++) {
    try {
      var hexdigit = i.toString(16).toLowerCase();
      fs.mkdirSync(path.join(this.dir, "00".substr(hexdigit.length)+hexdigit), 448); //0700
    } catch (e) {}
  }

  // This is the continuation queue. It effectively serializes access to the key
  // store -- only one person at a can read or write to each key at a time.
  this.ccQueue = {};
  // maps page keys to a list of functions to call on them. (if the list is not
  // empty, a function is running. the queue is shifted once the function
  // completes.)

}

Keystore.prototype.realSet = function(key, value, cb) {
  // Set the key to the value and call cb(error).
  // do not call this function directly; it should be placed on the key's
  // ccqueue to be run later. instead, call ks.set()
  cb = cb || function(){};

  // debug delay
  var cb2 = cb; // run the real callback with the real data after a short delay
  cb = function(data){ console.log("delay");
                        setTimeout(function(){
                            console.log("delay done");
                            cb2(data);}, 1000); };

  key = sha1(key);
  var base = key.substr(0,2),
      rest = key.substr(2), self = this;
  
      try {
        fs.writeFile(path.join(self.dir, base, rest),
                    JSON.stringify(value),
                    cb);
      } catch (e) {
        cb(e);
      }
};
Keystore.prototype.realGet = function(key, cb) {
  // call cb on the value stored in the key.
  // arg is 'undefined' if the object is not set.
  // do not call this function directly; it should be placed on the key's
  // ccqueue to be run later. instead, call ks.get()
  cb = cb || function(){};

  // debug delay
  var cb2 = cb; // run the real callback with the real data after a short delay
  cb = function(data){ console.log("delay");
                        setTimeout(function(){
                            console.log("delay done");
                            cb2(data);}, 1000); };

  key = sha1(key);
  var base = key.substr(0,2),
      rest = key.substr(2), self = this;
    fs.readFile(path.join(self.dir, base, rest), function(err, data) {
        if (err) {
          cb(); // cb will have undefined
        }
        try {
          cb(JSON.parse(data.toString()));
        } catch(e) {
          cb();
          // we should handle this better because this means that the object was
          // corrupt.
        }
      });
};

// CONTINUATION HANDLING
function runccs(cqueue) {
  // run all the continuations in cqueue. (only one instance of this should be
  // running at a time, so quit if cqueue is not empty)
  if (cqueue.running) {
    // someone else is doing this
    return;
  }
  console.log("in runccs");
  // now run the first continuation. each continuation should have a callback to
  // run once it is complete. this callback will simply run the next
  // continuation.
  (function run() {
    if (cqueue.ccs.length === 0) { cqueue.running = false; return; }
    cqueue.ccs[0](function(){ cqueue.ccs.shift(); run(); });
  })();
}

Keystore.prototype.set = function(key, data, cb) {
  console.log("Queueing a set");
  var self = this;
  this.ccQueue[key] = this.ccQueue[key] || {running: false, ccs: []};
  this.ccQueue[key].ccs.push(function(cc) {
      // this function will be run in due time
      // it should run realSet with the key and data
      // and after that is done (as callback) it should run cb then cc
      self.realSet(key, data, function(err){
          console.log("realSet is done");
          cb(err);
          cc();
        });
    });
  console.log("running continuation queue: ", this.ccQueue[key].length);
  runccs(this.ccQueue[key]);
};
Keystore.prototype.get = function(key, cb) {
  console.log("Queueing a get");
  var self = this;
  this.ccQueue[key] = this.ccQueue[key] || {running: false, ccs: []};
  this.ccQueue[key].ccs.push(function(cc) {
      // this function will be run in due time
      // it should run realGet with the key and data
      // and after that is done (as callback) it should run cb then cc
      self.realGet(key, function(data){
          console.log("real get returned, running callback");
          cb(data);
          cc();
        });
    });
  console.log("running continuation queue: ", this.ccQueue[key].length);
  runccs(this.ccQueue[key]);
};

exports.Keystore = Keystore;
