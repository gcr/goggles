function activateGoggles() {
  // your JavaScript code goes here!
  (function($){
      $("<canvas>").css({
          position: "absolute",
          "z-index": "100000",
          top: "0",
          left: "0",
          //"background-color": "#0f0",
          //border: "solid 3px #f00",
          width: "100%",
          height: "100%"
        }).appendTo(document.body);

  })(jQuery);
}

if (typeof jQuery == 'undefined') {
  var jQ = document.createElement('script');
  jQ.type = 'text/javascript';
  jQ.onload=activateGoggles;
  jQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
  document.body.appendChild(jQ);
} else {
  activateGoggles();
}
