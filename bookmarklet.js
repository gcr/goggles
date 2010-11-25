javascript: (function () {
    window.GOGGLE_SERVER='http://localhost:8002/';
    var scr = document.createElement('script');
    scr.type = 'text/javascript';
    scr.src = 'http://localhost/goggles/goggles.js?rand='+Math.random();
    document.documentElement.appendChild(scr);
})();
