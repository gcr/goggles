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
            this.cs = cs;
            setTimeout(this.callback, 150);
          },
          'should forget what it had': function(e,v) {
            assert.equal(this.cs.get('foo', undefined));
          }
        }
      }
    },

    'A fresh cache store with something in it': {
      topic: function(){
        var cs = new CacheStore(100);
        this.cs=cs;
        cs.set('hello', 'world');
        return cs;
      },
      'when poked after a while': {
        topic: function(cs){
          var cb=this.callback;
          setTimeout(function(){
              cs.get('hello');
              setTimeout(function(){
                  cs.get('hello');
                  setTimeout(cb, 50);
                }, 50);
            }, 50);
        },
        'will still remember things that would have timed out':function(){
          assert.equal(this.cs.get('hello'), 'world');
        }
      }
    }
  }).export(module);
