javascript: (function () {
    var scr = document.createElement('script');
    scr.type = 'text/javascript';
    scr.src = 'http://localhost/goggles/goggles.js?rand='+Math.random();
    document.documentElement.appendChild(scr);
})();
