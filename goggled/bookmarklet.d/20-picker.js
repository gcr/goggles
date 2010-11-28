/*globals bind */

// Picker widget
function hex2rgb(hex) {
  if (hex.length==4) {
    return {r: parseInt(hex.substr(1,1),16)*17,
            g: parseInt(hex.substr(2,1),16)*17,
            b: parseInt(hex.substr(3,1),16)*17};
  } else if (hex.length==7) {
    return {r: parseInt(hex.substr(1,2),16),
            g: parseInt(hex.substr(3,2),16),
            b: parseInt(hex.substr(5,2),16)};
  } else {
    return {r:0,g:0,b:0};
  }
}
function Picker(onPickColor) {
  var self = this;
  this.jq = $("<div>").css({
    position: "fixed",
    cursor: 'pointer',
    "z-index": "100001",
    border: "solid 1px #000",
    top: "0",
    left: "0"
  });
  var chosenColor = $();
  var colors = ["#000", "#fff", "#e50", "#fa0", "#1ba", "#e07", "#ab0"]
    .map(function(color) {
      var colorjq = $("<div>").css({"background-color": color,
                                    'color': (color=="#000"?"#fff":"#000"),
                                    'line-height': '64px',
                                    'font-size': '300%',
                                    'text-align': 'center',
                                    width: 32, height: 64});
      colorjq.click(function(){
          if (colorjq == chosenColor) { return; }
          onPickColor(hex2rgb(color));
          chosenColor.text("");
          chosenColor = colorjq;
          colorjq.html("&bull;");
        });
      colorjq.appendTo(self.jq);
      return colorjq;
    });
  colors[0].click();
}
Picker.prototype.del = function() {
  this.jq.fadeOut('fast', bind(this,function(){this.jq.remove();}));
};
Picker.prototype.show = function() {
  this.jq.hide().appendTo($("body")).slideDown('medium');
};

