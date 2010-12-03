/*global module*/
var vows = require('vows'),
    assert = require('assert');

vows.describe('basic sanity').addBatch({
    'Vows should work': {
      topic: 3,
      'It should equal 2': function(x) {
        assert.equal(x, 2);
      }
    }
  }).export(module);
