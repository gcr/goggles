var fs = require('fs'),
    proc = require('child_process'),
    http = require('http'),
    querystring = require('querystring'),
    url = require('url'),
    assert = require('assert'),
    site = require('../site'),
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

var testServer = null;
exports.AFreshServer = function(conf) {
  return function(){
    var cb = this.callback;
    exports.withFreshDir(conf.storeDir, function(){
        testServer = site.makeGogglesServer(conf);
        setTimeout(function(){
          cb(null, testServer);
        },100);
      });
  };
};
exports.getTestServer = function() {
  return function(){
    return testServer;
  };
};

function get(page, query, cb) {
  cb = cb || this.callback;
  var u = url.parse(page),
      host = u.hostname,
      port = u.port,
      req = http
        .createClient(port, host)
        .request('GET',
            (u.pathname||'/')+(query?'?'+querystring.stringify(query):""),
            {host: host});
  req.on('response', function(res) {
      var data = '';
      res.on('data', function(d){data+=d;});
      res.on('end', function() {
          cb(null, data);
      });
  });
  req.end();
}

exports.get = function(page, query, cb) {
  return function(){
    return get.call(this, page, query, cb);
  };
};

function getJSON(page, query, cb) {
  cb = cb || this.callback;
  get(page, query, function(err, data) {
      try {
        cb(null, JSON.parse(data.trim()));
      } catch (e) {
        cb(e);
      }
    });
}

exports.getJSON = function(page, query, cb) {
  return function(){
    getJSON.call(this, page, query, cb);
  };
};

exports.swallowErr = function(f) {
  // turns function(err, data) into function(data)
  return function(err, data) {
    assert.isNull(err);
    return f(data);
  };
};
