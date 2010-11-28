function getUrl() {
  // return a unique URL for this page
  var l = document.location,
      base = l.protocol+"//"+l.host+"/"+l.pathname;

  // special cases
  if (l.host == 'board.iamlights.com') {
    base = base + l.search.replace(new RegExp('page__.*'), '');
    if (base[base.length-1] == '/') {
      base = base.substr(0, base.length-1);
    }
  }

  return base;
}
