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
// Note that this is just stupid. No checking is done to ensure you don't
// overwrite things at the same time from two different times in the event loop,
// and no caching or anything is done (the OS might be better at it anyway).
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
      fs.mkdirSync(path.join(this.dir, i.toString(16).toLowerCase()), 0700);
    } catch (e) {}
  }
}

Keystore.prototype.set = function(key, value, cb) {
  // Set the key to the value and call cb(error).
  cb = cb || function(){};
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

Keystore.prototype.get = function(key, cb) {
  // call cb on the value stored in the key.
  // arg is 'undefined' if the object is not set.
  cb = cb || function(){};
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

exports.Keystore = Keystore;

var k = new Keystore('store');
for (var i=0; i<10000; i++) {
  k.get(""+i, console.log);
}
