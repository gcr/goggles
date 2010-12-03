var fs = require('fs'),
    proc = require('child_process');

exports.fresh_dir = function(dir){
  return function(){
    var cb = this.callback;
    proc.spawn('rm', ['-rf', dir])
    .on('exit', function(code){
        if (code===0) {
          fs.mkdir(dir, 448, cb);
        } else {
          throw new Error("rm failed");
        }
      });
  };
};
