/*global module*/
var vows = require('vows'),
    assert = require('assert'),
    com = require('./common'),
    get = com.get,
    herr = com.swallowErr,
    getJSON = function(query, cb) {
      return com.getJSON('http://localhost:5555/page', query, cb);
    };

vows.describe('Client-server protocol').addBatch({
    'A server': {
      topic: com.AFreshServer({
          port: 5555,
          emptyCbTimeout: 200,
          storeDir: "/tmp/goggles-server-ks"
        }),

      'when poked': {
        topic: get('http://localhost:5555/', {}),
        'should respond.': function(data) {
          assert.isString(data);
          assert.ok(data.length > 0);
        }
      },

      'when asked for a nonexistant page': {
        topic: getJSON({page: 'http://google.com//'}),
        'should respond with a page': herr(function(page) {
          assert.ok(page);
        }),
        'the page should be marked as `first`': herr(function(page) {
          assert.isTrue(page.first);
        }),
        'the page should be empty': herr(function(page) {
          assert.length(page.shapes, 0);
        }),
        'the page should be at the beginning of its history': herr(function(page) {
          assert.equal(page.nextUpdate, 0);
        })
      },

      'can add shapes.': {
        topic: getJSON({page: 'http://shape-add//',
              t: 15, r: 0, g: 25, b: 250, a: 0,
              p: "12,35;35,99;0,-235;",add: 't'}),
        'This should return *true*.': herr(function(page){
            assert.isTrue(page);
        }),
        'When adding the same shape again,': {
          topic: getJSON({page: 'http://shape-add//',
              t: 15, r: 0, g: 25, b: 250, a: 0,
              p: "12,35;35,99;0,-235;",add: 't'}),
          'it should detect the new shape as a duplicate and return *false*':
            herr(function(page){
              assert.isFalse(page);
            }),
          'and the page is retrieved,': {
            topic: getJSON({page: 'http://shape-add//'}),
            'the page should only contain the first shape': herr(function(page){
                assert.length(page.shapes, 1);
              })
          }
        },
        'When asked,': {
          topic: getJSON({page: 'http://shape-add//'}),
          'the page will have the shape we added.': herr(function(page){
              assert.deepEqual(page.shapes, [
                  {t: 15, r: 0, g: 25, b: 250, a: 0,
                p: [[12,35],[35,99],[0,-235]]}]);
          }),
          'the page will advance its history': herr(function(page){
              assert.equal(page.nextUpdate, 1);
          })
        }
      },

      // A server
      'can add many shapes': {
        topic: getJSON({page: 'http://many-shapes-add//',
            t: 15, r: 0, g: 25, b: 250, a: 0,
            p: "12,35;35,99;0,-235;",add: 't'}),
        '.':{
        topic: getJSON({page: 'http://many-shapes-add//',
            t: 15, r: 0, g: 25, b: 250, a: 0,
            p: "1,2;3,5;9,19;",add: 't'}),
        '.':{
        topic: getJSON({page: 'http://many-shapes-add//',
            // todo! change the colors and keep the points the same.
            t: 15, r: 0, g: 25, b: 250, a: 0,
            p: "1,2;3,7;9,19;",add: 't'}),
          'and when asked': {
            topic: getJSON({page: 'http://many-shapes-add//'}),
            'will have the shapes': herr(function(page){
                assert.length(page.shapes,3);
              }),
            'will advance its history': herr(function(page){
                assert.equal(page.nextUpdate, 3);
              }),
            'can delete shapes.': {
              topic: getJSON({page: 'http://many-shapes-add//',
                  t: 15, r: 0, g: 25, b: 250, a: 0,
                  p: "1,2;3,5;9,19;", del: 't'}),
              'When asked,': {
                topic: getJSON({page: 'http://many-shapes-add//'}),
                'the page will not have the shape we deleted': herr(function(page){
                    assert.length(page.shapes, 2);
                  }),
                'the page will advance its history': herr(function(page){
                    assert.equal(page.nextUpdate, 4);
                  })
              }
            }
          }
      } } }

  /*
      'can stream updates': {
        'when we add shapes': {

        },
        'when we delete shapes': {

        }
      },

      'will time out the stream if nothing happens': {

      }
      */

    }
/*
    'When timing out...': {
      topic: function(){setTimeout(this.callback, 1000);},
      'it should be called': function(){}
    }
*/
}).addBatch({
    'The server...': {
      topic: com.getTestServer(),
      'can be stopped.': function(svr){
        svr.close();
      }
    }
}).export(module);
