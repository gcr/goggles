/*global module*/
var vows = require('vows'),
    com = require('./common'),
    assert = require('assert'),
    events = require('events'),
    History = require('../models/history').History;

vows.describe('History objects').addBatch({
    'A history': {
      topic: new History(100),
      'starts out empty': function(h) {
        assert.equal(h.time(), 0);
        assert.length(h.history, 0);
      }
    },

    'A history with stuff in it': {
      topic: function() {
        var h = new History(100);
        this.h = h;
        h.add('a'); h.add('b'); h.add('c');
        return h;
      },

      'responds to after()': {
        topic: function(h){ h.after(0, this.callback); },
        'and receives the objects we added.': function(elts, e) {
          assert.deepEqual(elts, ['a', 'b', 'c']);
        },
        'and reflects the proper time': function(elts, e) {
          assert.equal(this.h.time(), 3);
        }
      },

      'when asked for just a few elements': {
        topic: function(h){ h.after(h.time()-2, this.callback); },
        'will only return the latest elements': function(elts, e) {
          assert.deepEqual(elts, ['b', 'c']);
        }
      },

      'after waiting far past its timeout': {
        topic: function(){ setTimeout(this.callback, 550); },
        'upon calling after': {
          topic: function(x, hist) { hist.after(0, this.callback); },
          'will garbage-collect its objects': function(elts, e) {
            assert.length(elts, 0);
          },
          'but the time should not change.': function(elts,e) {
            assert.equal(this.h.time(), 3);
          }
        }
      }
    },

    'A blank history': {
      topic: function(){ return new History(100); },

      'waiting for a bit on an `after()` call': {
        topic: function(h) {
          // we're checking that h.after doesn't call its callback too soon
          var promise = new events.EventEmitter(),
              done = false;
          h.after(0, function(what) {
              if (done) { return; }
              done = true;
              promise.emit('error', 'too fast');
            });
          setTimeout(function(){
              if (done) { return; }
              done = true;
              promise.emit('success');
            }, 50);
          return promise;
        },
        'should not immediately call any callbacks because we never added anything.': function(e,v){
          assert.isNull(e);
        }
      },

      'waiting longer than its timeout on an `after()` call': {
        topic: function(h) {
          var promise = new events.EventEmitter(),
              done = false;
          h.after(0, function(what) {
              if (done) { return; }
              done = true;
              promise.emit('success', what);
            });
          setTimeout(function(){
              if (done) { return; }
              done = true;
              promise.emit('error', 'too slow');
            }, 150);
          return promise;
        },
        'should time out with a blank list eventually': function(e, what) {
          assert.isNull(e);
          assert.deepEqual(what, []);
        }
      }
    },

    'A history with pending callbacks': {
      topic: function() {
        var h = new History(100);
        this.h = h;
        var promise = new events.EventEmitter(), self = this;
        h.after(1, function(what) {
            self.fired = (self.fired||0) + 1;
            self.what = what;
          });
        h.after(1, function(what) {
            self.fired = (self.fired||0) + 1;
            self.what = what;
          });
        return h;
      },
      'should fire them when `add()` is called.': function(h) {
        this.h.add('FOO');
        this.h.add('BAR');
        assert.deepEqual(this.what, ['BAR']);
        assert.equal(this.fired, 2);
      }
    }

  }).export(module);
