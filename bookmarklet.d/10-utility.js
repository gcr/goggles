// Utility functions
function bind(bindee, action) {
  return function() {
    return action.apply(bindee, Array.prototype.slice.call(arguments));
  };
}

function pointsFromEv(ev) {
  // given an event object, return the point's XY coordinates relative to
  // the screen
  if ('clientX' in ev) { // Firefox
    return [ev.clientX, ev.clientY];
  } else if ('offsetX' in ev) { // Opera
    return [ev.offsetX, ev.offsetY];
  }
}

function getUrl() {
  // return a unique URL for this page
  return document.location.protocol+"//"+document.location.host+"/"+document.location.pathname;
}
