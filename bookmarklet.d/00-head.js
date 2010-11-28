/*jslint bitwise:false */
function activateGoggles() {
jQuery.noConflict();

(function($){ // <- hm, maybe not the best way of passing jquery in
  if (window.goggles && window.goggles.active) {
    window.goggles.stop(); window.goggles = null; return;
  }
