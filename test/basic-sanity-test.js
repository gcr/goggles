/*global module*/
var vows = require('vows'),
    assert = require('assert');

vows.describe('basic sanity').addBatch({
    'When passing in a 2...': {
      topic: 2,
      'It should equal 2': function(x) {
        assert.equal(x, 2);
      }
    }
/*    ,
    'When timing out...': {
      topic: function(){setTimeout(this.callback, 1000);},
      'it should be called': function(){}
    }
*/
  }).export(module);
