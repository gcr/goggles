/*jslint regexp:false */
// gogled
// shape server. Look up pages by key or add to them.
//
// This is so not-RESTy that it's not even funny. Having URLs each be own
// resources would be mighty inconvenient, so we'll just do like this:
// http://server/?lookup=http%3a%2f%2fgoogle.com%2f
//
// This page handles (should handle!) all of the view functions.

var site = require('./site'),
    conf = {
      port: 8002,
      emptyCbTimeout: 25*1000,
      storeDir: "store",
      closure: true,
      fade: true
    };

site.makeGogglesServer(conf);
console.log('Server running at http://127.0.0.1:'+conf.port+'/');
