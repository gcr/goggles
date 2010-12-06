/*global module*/
var vows = require('vows'),
    assert = require('assert'),
    CacheStore = require('../models/cachestore.js').CacheStore;

vows.describe('Caching stores').addBatch({
    'A fresh cache store': {
      topic: new CacheStore(100),
      'should return undefined for unknown things': function(cs) {
        assert.strictEqual(cs.get('hello'), undefined);
      },
      'can set values': {
        topic: function(cs) { cs.set('foo', 'bar'); return cs; },
        'and should return the same thing back': function(cs) {
          assert.equal(cs.get('foo'), 'bar');
        },
        '(even multiple values)': {
          topic: function(cs) { cs.set('foo2', [1,2,3]); return cs; },
          'and keep the first one': function(cs) {
            assert.equal(cs.get('foo'), 'bar');
          },
          'and keep the second one': function(cs) {
            assert.deepEqual(cs.get('foo2'), [1,2,3]);
          }
        },
        'and after timing out': {
          topic: function(cs) {
            var cb = this.callback;
            this.cs = cs;
            setTimeout(cb, 150);
          },
          'should forget what it had': function(e,v) {
            assert.equal(this.cs.get('foo', undefined));
          }
        }
      }
    }
  }).export(module);
