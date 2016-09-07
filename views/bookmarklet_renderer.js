// bookmarklet_renderer.js -- Renders the bookmarklet by concatenating
// all the files in bookmarklet.d together.

var path = require('path'),
    fs = require('fs'),
    http = require('http'),
    querystring = require('querystring'),
    BOOKMARKLETD_DIR='bookmarklet.d',
    BOOKMARKLET_BANNER='//\n// This minified code is part of goggles.\n'+
      '// @source: https://github.com/gcr/goggles\n'+
      '//\n',
    bookmarkletSource = null;

function load() {
  bookmarkletSource = fs
        .readdirSync(BOOKMARKLETD_DIR)
        .map(function (s) { return path.basename(s); })
        .sort()
        .filter(function(filename){
            return filename.match(/\.js$/i);
          })
        .map(function(filename){
            return "////////// "+filename+" ////////////////\n\n" +
              fs.readFileSync(path.join(BOOKMARKLETD_DIR,filename)).toString();
          })
        .join('\n');
}

function closureCompile() {
  console.log("Compiling code...");
  var request = http
        .createClient(80, 'closure-compiler.appspot.com')
        .request('POST', '/compile', {
            'Host': 'closure-compiler.appspot.com',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          });

  request.on('response', function(res) {
      var body = '';
      res.on('data', function(data) { body += data.toString(); });
      res.on('end', function() {
          var json = JSON.parse(body);
          if (json.errors ||
              json.warnings ||
              typeof json.compiledCode == 'undefined' ||
              json.compiledCode.length===0) {
            console.log("Error! Code has errors!");
            console.log(require('util').inspect(json));
            setTimeout(function(){
                process.exit(1);
              }, 1000);
          } else {
            console.log("Closure compiler returned "+json.compiledCode.length+" bytes of code");
            console.log("(saved us "+(bookmarkletSource.length-json.compiledCode.length)+" bytes");
              console.log("that's "+Math.round(100*json.compiledCode.length/bookmarkletSource.length)+"% of original size)");
            bookmarkletSource = BOOKMARKLET_BANNER+json.compiledCode;
          }
        });
    });
  request.end(querystring.stringify({
    output_format:'json',
    output_info:'compiled_code',
    //output_info:'warnings',
    //output_info:'errors',
    compilation_level:'SIMPLE_OPTIMIZATIONS',
    warning_level: 'default',
    output_file_name: 'default.js',
    js_code:bookmarkletSource
  }).replace(/output_info=/i, 'output_info=warnings&output_info=errors&output_info='));
}

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
exports.load = load;
exports.closureCompile = closureCompile;
exports.makeRenderer = makeRenderer;
