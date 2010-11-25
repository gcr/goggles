/*jslint regexp:false */
// gogled
// shape server. Look up pages by key or add to them.
//
// This is so not-RESTy that it's not even funny. Having URLs each be own
// resources would be mighty inconvenient, so we'll just do like this:
// http://server/?lookup=http%3a%2f%2fgoogle.com%2f
//
// Only two ops: add and page lookup.

var http = require('http'),
    url = require('url'),
    Pagestore = require('./pagestore').Pagestore,
    ps = new Pagestore("store"),

    PORT = 8002;

function failWith(req, res, message) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(JSON.stringify({err: message})+'\n');
}

function renderJson(req, res, obj) {
  var json;
  var query = url.parse(req.url, true).query || {};
  if (typeof obj == 'undefined') {
    json = JSON.stringify(null);
  } else {
    json = JSON.stringify(obj);
  }
  if ('jsonp' in query || 'callback' in query) {
      json = (query.jsonp || query.callback) + "(" + json + ")\n";
  } else {
    json = json + "\n";
  }
  res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8",
                                        // todo: change to text/json
                        'Cache-Control': 'no-cache, must-revalidate',
                        'Expires': 'Mon, 20 Dec 1998 01:00:00 GMT',
                        'Last-Modified': new Date().toUTCString(),
                        'Pragma': 'no-cache',
                        "Content-Length": json.length});
  res.end(json);
}

function receive(req, res) {
  try {
    var u = url.parse(req.url, true),
        path = u.pathname.split('/'),
        hash = path[1],
        q = u.query||{};
      if (path[1] == 'favicon.ico') {
        res.writeHead(404); res.end("No favicon here");
        return;
      }

      // this actually sends the response back
      function render(data) { return renderJson(req, res, data); }

      // dispatch based on what we want to do
      if (q.page && q.page.length > 2) {
        if (q.add) {
          // Add a page
          var shape = ps.verifyShape(q.p, q.t, q.r, q.g, q.b, q.a);
          if (shape) {
            return ps.addShapeToPage(q.page, shape, render);
          } else {
            failWith(req, res, "One or more of your shape paramaters is invalid.");
          }
        } else if (q.stream) {
          // Stream shape updates =3
          return ps.streamPageUpdates(q.page, parseInt(q.stream, 10), render);
        } else {
          // Just lookup the page
          return ps.getPageInfo(q.page, render);
        }
      }

      failWith(req, res, "unknown action");
  } catch(e) {
    console.log(e.stack);
    return failWith(req, res, "Server error -- please try again");
  }
}

http.createServer(receive).listen(PORT, "127.0.0.1");
console.log('Server running at http://127.0.0.1:'+PORT+'/');
