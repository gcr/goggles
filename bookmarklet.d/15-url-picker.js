function getUrl() {
  // return a unique URL for this page
  //
  // due to a stupid mistake all URLs look like
  // http://foo.com//bar instead of
  // http://foo.com/bar like they should be.
  // too many slashes? sorry...

  var l = document.location,
      base = l.protocol+"//"+l.host+"/"+l.pathname;

  // special cases
  if (l.host == 'board.iamlights.com') {
    base = base + l.search.replace(new RegExp('page__.*'), '');
    if (base[base.length-1] == '/') {
      base = base.substr(0, base.length-1);
    }
  } else if (l.host == 'twitter.com') {
    // twitter uses 'pretty' URLs
    if (l.hash.indexOf("#!")===0) {
      base = base + (l.hash.indexOf('/')==2? l.hash.substr(3)
                                           : l.hash.substr(2));
    }
  }

  return base;
}
