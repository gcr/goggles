/*jslint regexp:false */
// gogled
// shape server. Look up pages by key or add to them.
//
// This is so not-RESTy that it's not even funny. Having URLs each be own
// resources would be mighty inconvenient, so we'll just do like this:
// http://server/?lookup=http%3a%2f%2fgoogle.com%2f
//
// This page handles (should handle!) all of the view functions.

var http = require('http'),
    url = require('url'),
    Pagestore = require('./pagestore').Pagestore,
    ps = new Pagestore("store"),
    staticfiles = require('./static'),
    view = require('./view_helpers'),
    switchboard = require('./switchboard'),

    PORT = 8002;


function receive(req, res) {
  // this actually sends the response back
  function render(data) { return view.renderJson(req, res, data); }
  try {
    return switchboard.dispatch(req, res, url.parse(req.url).pathname, {
        '': function(req, res) { view.renderJson(req, res, "hello"); },

        'favicon.ico': function(){
          res.writeHead(404); res.end("No favicon here");
        },

        'bookmarklet.js': staticfiles.makeSingleFileServer('../goggles.js'),

        'page': switchboard.makeDispatchQueryOverloader(
            ['add', 'page','t','r','g','b','a','p'],
            function(req,res, add,page,t,r,g,b,a,p){
              var shape = ps.verifyShape(p, t, r, g, b, a);
              if (shape) {
                return ps.addShapeToPage(page, shape, render);
              } else {
                view.failWith(req, res, "One or more of your shape paramaters is invalid.");
              }
            },
            ['del', 'page','t','r','g','b','a','p'],
            function(req,res, del,page,t,r,g,b,a,p){
              // I know it's stupid to delete the shape by passing in every
              // parameter...
              var shape = ps.verifyShape(p, t, r, g, b, a);
              if (shape) {
                return ps.deleteShapeFromPage(page, shape, render);
              } else {
                view.failWith(req, res, "One or more of your shape paramaters is invalid.");
              }
            },
            ['stream', 'page'],
            function(req,res, stream,page){
              // Stream shape updates =3
              return ps.streamPageUpdates(page, parseInt(stream, 10), render);
            },
            ['page'],
            function(req,res, page){
              // Just lookup the page
              return ps.getPageInfo(page, render);
            },
            [],
            function(rq,rs){
              view.failWith(req, res, "unknown action");
            }
          )
        });

  } catch(e) {
    console.log(e.stack);
    return view.failWith(req, res, "Server error -- please try again");
  }
}

http.createServer(receive).listen(PORT, "0.0.0.0");
console.log('Server running at http://127.0.0.1:'+PORT+'/');
