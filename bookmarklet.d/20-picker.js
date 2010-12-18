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
function Picker(onPickColor, onPickBrush) {
  var self = this;
  this.colorsJq = $("<div>").css({
    position: "fixed",
    cursor: 'pointer',
    "z-index": "100001",
    top: "0",
    left: "0",
    width: "32px",
    border: 'solid 1px #000'
  });
  var chosenColor = $();
  // different brush colors!
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
      colorjq.appendTo(self.colorsJq);
      return colorjq;
    });
  colors[0].click();

  // different brush sizes!
  var chosenBrush = $();
  this.brushesJq = $("<div>")
        .css({
            position: "fixed",
            cursor: 'pointer',
            "z-index": "100001",
            top: "0",
            left: "32px",
            'float': 'right',
            'background-color':'#fff',
            color:'#000',
            margin:0
          });
  var brushes = [2,5,10,15,20]
    .map(function(size) {
        var brushJq = $("<div>")
              .css({
                display: 'block',
                'float': 'left',
                width: "32px",
                padding:0,
                height: "32px"
              });
        brushJq.append($("<div>")
            .css({
                position: "absolute",
                height: size+"px",
                'background-color': "#000",
                top: (16-size/2)+"px",
                width: "32px"
              }));
        brushJq.click(function(){
          if (brushJq == chosenBrush) { return; }
            onPickBrush(size);
            chosenBrush = brushJq;
            //chosenColor.text("");
            //colorjq.html("&bull;");
          });
        brushJq.appendTo(self.brushesJq);
        return brushJq;
    });
  brushes[0].click();
}
Picker.prototype.del = function() {
  this.colorsJq.fadeOut('fast', bind(this,function(){this.colorsJq.remove();}));
  this.brushesJq.fadeOut('fast', bind(this,function(){this.brushesJq.remove();}));
};
Picker.prototype.show = function() {
  this.brushesJq.hide().appendTo($("body")).slideDown('medium');
  this.colorsJq.hide().appendTo($("body")).slideDown('medium');
};

