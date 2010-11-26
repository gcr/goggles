javascript: (function () {
    window.GOGGLE_SERVER='http://goggles.sneakygcr.net/';
    var scr = document.createElement('script');
    scr.type = 'text/javascript';
    scr.src = 'http://goggles.sneakygcr.net/bookmarklet.js?rand='+Math.random();
    document.documentElement.appendChild(scr);
})();
