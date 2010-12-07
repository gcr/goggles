/*global module*/
var vows = require('vows'),
    assert = require('assert'),
    com = require('./common'),
    fs = require('fs'),

    TEMP_KEYSTORE='/tmp/keystore';

vows.describe('Keystores').addBatch({
    'A fresh keystore': {
      topic: com.AFreshKeystore(TEMP_KEYSTORE),

      'should have a file structure': {
        topic: function(){ fs.readdir(TEMP_KEYSTORE, this.callback); },
        'with 256 subfolders -- one for each octet': function(dirs){
          assert.length(dirs, 256);
        }
      },

      'should be able to store something': {
        topic: function(ks){ ks.set('something', {1: 2, 3: "foo"}, this.callback); },

        'with no errors.': function(e) {
          assert.strictEqual(e, undefined);
        },

        'and when retrieved,': {
          topic: function(a, ks){
            var cb = this.callback;
            ks.get('something', cb);
          },

          'the values should be equal.': function(v, e) {
            assert.deepEqual(v, {"1": 2, "3": "foo"});
          }
        }
      },

      'can get a nonexistant key': {
        topic: function(ks){ ks.get('nonexistant', this.callback); },
        'It should be undefined.': function(retr){
          assert.strictEqual(retr, undefined);
        }
      }
    }

  }).export(module);
