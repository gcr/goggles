// bookmarklet_renderer.js -- Renders the bookmarklet by concatenating
// all the files in bookmarklet.d together.

var path = require('path'),
    fs = require('fs'),
    BOOKMARKLETD_DIR='bookmarklet.d',
    bookmarkletSource = fs
          .readdirSync(BOOKMARKLETD_DIR)
          .map(path.basename)
          .sort()
          .map(function(filename){
              return fs.readFileSync(path.join(BOOKMARKLETD_DIR,filename));
            })
          .join('\n');

function render(req, res) {
  // send the bookmarklet to the client =3
  res.writeHead(200, {"Content-Type": "text/javascript",
                      //// todo! do I really want caching?
                      //'Cache-Control': 'no-cache, must-revalidate',
                      //'Expires': 'Mon, 20 Dec 1998 01:00:00 GMT',
                      //'Last-Modified': new Date().toUTCString(),
                      //'Pragma': 'no-cache',
                      "Content-Length": bookmarkletSource.length});
  res.end(bookmarkletSource);
}
function makeRenderer() {
  return function(req, res) {
    return render(req, res);
  };
}

exports.render = render;
exports.makeRenderer = makeRenderer;
