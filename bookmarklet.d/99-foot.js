})(jQuery);}

if (typeof window.goggles == 'undefined') {
  // First time: we want to load OUR version of jquery
  var jQ = document.createElement('script');
  jQ.type = 'text/javascript';
  jQ.onload=activateGoggles;
  jQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
  document.body.appendChild(jQ);
} else {
  // Subsequent loads: we already have our jquery so it should be fine
  activateGoggles();
}
