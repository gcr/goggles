var url = require('url');

function failWith(req, res, message) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(JSON.stringify({err: message})+'\n');
}

function renderJson(req, res, obj) {
  var json;
  var query = url.parse(req.url, true).query || {};
  json = JSON.stringify(typeof obj=='undefined'? null : obj);
  if ('jsonp' in query || 'callback' in query) {
      json = (query.jsonp || query.callback) + "(" + json + ")";
  }
  json = json + "\n";
  res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8",
                                        // todo: change to text/json
                      'Cache-Control': 'no-cache, must-revalidate',
                      'Expires': 'Mon, 20 Dec 1998 01:00:00 GMT',
                      'Last-Modified': new Date().toUTCString(),
                      'Pragma': 'no-cache',
                      "Content-Length": json.length});
  res.end(json);
}

exports.renderJson = renderJson;
exports.failWith = failWith;
