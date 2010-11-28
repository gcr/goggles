function getUrl() {
  // return a unique URL for this page
  var l = document.location,
      base = l.protocol+"//"+l.host+"/"+l.pathname;

  // special cases
  if (l.host == 'board.iamlights.com') {
    return base + l.search;
  }

  return base;
}
