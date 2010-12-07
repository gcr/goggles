/*global module*/
var vows = require('vows'),
    assert = require('assert'),

    AsyncLock = require('../models/async_lock').AsyncLock;

vows.describe('Asynchronous locks').addBatch({
    'An async lock': {
      topic: function(){
        var lock = new AsyncLock(),
            cb = this.callback,
            list = [1,2,3];
        lock.lock(function(unlock){
            setTimeout(function(){
                list = [];
                unlock();
              }, 20);
          });
        lock.lock(function(unlock){
            setTimeout(function(){
                list.push(4);
                unlock();
              }, 5);
          });
        lock.lock(function(unlock){
            setTimeout(function(){
              cb(list);
              unlock();
            }, 5);
          });
      },
      'should only allow one asynchronous operation at a time': function(list,e) {
        assert.deepEqual(list, [4]);
      }
    }
  }).export(module);
