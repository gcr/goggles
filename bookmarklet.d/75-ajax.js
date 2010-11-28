/*globals Goggles Shape */
// AJAX functions
//
// TODO: handle timeouts
function ajaxRequest(url, data, cb) {
  // just like jQuery.getJSON but unlike jquery, this handles timeouts in a sane way.
  return $.ajax({
    url: url,
    //dataType: 'json',
    dataType: 'jsonp',
    jsonp: 'jsonp',
    data: data,
    success:
      function(data, textStatus) {
        if (typeof data == 'object' && 'exception' in data) {
          alert("An error appears: " + data.exception);
        } else {
          cb(data, textStatus);
        }
      },
    error:
      function(xhr, e, exception) {
        if (e == 'timeout') {
          ajaxRequest(url, data, cb);
        } else {
          //alert("Network error: " + e);
        }
      }
  });
}
function StreamingHistory(url, data, startTime, cb) {
  // todo: the server shouldn't take longer than 10s so timeout after 12s.
  // note that we need to properly handle cases where the server sends us
  // something eventually after we've requested the next batch (remember: we
  // gotta ignore the first response). We also need some way of notifying the
  // user thaht their connection is fuzzy and when/if they were able to
  // reconnect.

  // This object will run a callback when something on the server changes.
  // Give it a URL to ping and a callback to execute whenever that
  // happens and it'll go on its way. Whenever the server does something,
  // the callback will run with the server's response. This is done in such
  // a way so you won't ever skip history you missed.
  // See: history.js
  this.cb = cb;
  this.url = url;
  this.data = data;
  this.time = startTime;

  this.active = true;

  var self = this;
  this.nextHist();
}
StreamingHistory.prototype.nextHist = function() {
  // Carry out the next action in the history, calling callback if we get
  // anything.
  if (!this.active) {
    return;
  }
  var self = this;
  this.data.stream = this.time;
  this.xhr = ajaxRequest(this.url, this.data,
    function (actions) {
      if (!self.active) {
        return;
      }
      for (var i = 0, l = actions.length; i < l; i++) {
        self.cb(actions[i]);
        self.time++;
      }
      self.nextHist();
    });
};
StreamingHistory.prototype.stop = function() {
  // Stop current request and stop streaming from the server.
  // TODO: this doesn't actually work because JSONP requests are nothing more
  // than adding <script> tags at the end of the document which are loaded and
  // executed serially. :<
  this.active = false;
  if (this.xhr !== undefined) {
    this.xhr.abort();
  }
};

function serializePoints(points){
  // return the points in a suitable format for the server
  // [[1,2],[3,4]] => "1,2;3,4"
  return points.map(function(point){
      return point[0]+","+point[1];
    }).join(';');
}
Goggles.prototype.connect = function(cb) {
  // Initial connection from the server.
  cb = cb || function(){};
  var self = this;
  ajaxRequest(this.serverUrl, {
      page: this.url
    }, function(json) {
      if (json.err) {
        alert(json.err);
        return self.stop();
      }
      if (self.active) {
        self.shapes = json.shapes.map(Shape.fromJSON);
        self.redraw();
        cb();
        self.historyStream = new StreamingHistory(self.serverUrl, {page: self.url},
          json.nextUpdate,
          function(event) {
            if (event.add_shape) {
              self.shapes.push(Shape.fromJSON(event.add_shape));
              self.redraw();
            } else if (event.delete_shape) {
              self.deleteShape(Shape.fromJSON(event.delete_shape));
              self.redraw();
            }
          });
      }
    });
};
Goggles.prototype.sendShape = function(shape) {
  // todo: find a way of telling that we couldn't send the shape and
  // recovering
  var self = this;
  ajaxRequest(this.serverUrl, {
      page: this.url, add: 't',
      r: shape.r, g:shape.g, b:shape.b, a:shape.a,t:shape.t,
      p:serializePoints(shape.p)},
    function(data){
      if (data && data.err) {
        alert("There was a problem sending the shapes to the server.");
        self.stop();
      }
    });
};
Goggles.prototype.sendDeleteShape = function(shape) {
  // todo: find a way of telling that we couldn't erase the shape and
  // recovering
  var self = this;
  ajaxRequest(this.serverUrl, {
      page: this.url, del: 't',
      r: shape.r, g:shape.g, b:shape.b, a:shape.a,t:shape.t,
      p:serializePoints(shape.p)},
    function(data){
      if (data && data.err) {
        alert("There was a problem deleting the shape.");
        self.stop();
      }
    });
};
