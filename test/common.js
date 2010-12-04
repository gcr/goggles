var fs = require('fs'),
    proc = require('child_process'),
    Keystore = require('../models/keystore').Keystore;

exports.withFreshDir = function(dir, cb){
  proc.spawn('rm', ['-rf', dir])
  .on('exit', function(code){
      if (code===0) {
        fs.mkdir(dir, 448, cb);
      } else {
        throw new Error("rm failed");
      }
    });
};

exports.AFreshDir = function(dir, obj) {
  obj.topic = function(){ exports.withFreshDir(dir, this.callback); };
  return { 'In a fresh dir,': obj };
};

exports.AFreshKeystore = function(dir) {
  return function(){
    var cb = this.callback;
    exports.withFreshDir(dir, function(e, v){
        var ks = new Keystore(dir);
        cb(null, ks);
      });
  };
};
