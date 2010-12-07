/*global module*/
var vows = require('vows'),
    assert = require('assert'),
    com = require('./common'),
    events = require('events'),
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
    //'the page should be marked as `first`': herr(function(page) {
    //  assert.isTrue(page.first);
    //}),
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
      'and when the page is retrieved,': {
        topic: getJSON({page: 'http://shape-add//'}),
        'the page should only contain the first shape': herr(function(page){
            assert.length(page.shapes, 1);
          })
      }
    },
    'When checked,': {
      topic: getJSON({page: 'http://shape-add//'}),
      'the page should have the shape we added.': herr(function(page){
          assert.deepEqual(page.shapes, [
              {t: 15, r: 0, g: 25, b: 250, a: 0,
                p: [[12,35],[35,99],[0,-235]], id: 0}]);
      }),
      'the page should advance its history': herr(function(page){
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
    '.': {
      topic: getJSON({page: 'http://many-shapes-add//'}),
      'the page should have the shapes': herr(function(page){
          assert.length(page.shapes,3);
        }),
      'the page should advance its history': herr(function(page){
          assert.equal(page.nextUpdate, 3);
        }),
      'the shapes should all have different IDs': herr(function(page){
          assert.equal(page.shapes[0].id, 0);
          assert.equal(page.shapes[1].id, 1);
          assert.equal(page.shapes[2].id, 2);
        }),
      'The page can then delete shapes.': {
        topic: getJSON({page: 'http://many-shapes-add//',
            t: 15, r: 0, g: 25, b: 250, a: 0,
            p: "1,2;3,5;9,19;", del: 't'}),
        'Afterwards,': {
          topic: getJSON({page: 'http://many-shapes-add//'}),
          'when deleting the same shape': {
            topic: getJSON({page: 'http://many-shapes-add//',
                t: 15, r: 0, g: 25, b: 250, a: 0,
                p: "1,2;3,5;9,19;", del: 't'}),
            'it should detect the new shape as a duplicate and return *false*':
              herr(function(page){
                assert.isFalse(page);
              })
          },
          'the page should not have the shape we deleted': herr(function(page){
              assert.length(page.shapes, 2);
            }),
          'the page should advance its history': herr(function(page){
              assert.equal(page.nextUpdate, 4);
            }),
          'we can still add more shapes.': {
            topic: getJSON({page: 'http://many-shapes-add//',
                t: 1, r: 2.35, g: 25, b: 50, a: 0,
                p: "99,-2350;33,22;", add: 't'}),
            'The new shape': {
              topic: getJSON({page: 'http://many-shapes-add//'}),
              'should be present': herr(function(page){
                  assert.length(page.shapes, 3);
                }),
              'should have a new ID': herr(function(page){
                  assert.equal(page.shapes[2].id, 3);
                }),
              "should advance the page's history": herr(function(page){
                  assert.equal(page.nextUpdate, 5);
                })
            }
          }
        }
      }
    }
  } } },

// A server
'can stream updates such that when we add shapes': {
topic: function(){
  getJSON({page: 'http://streaming-test//', stream: 0}, this.callback)();
  setTimeout(function(){
    getJSON({page: 'http://streaming-test//',
      t: 1, r: 0, g: 25, b: 250, a: 0,
      p: "1,2;3,4;5,6;",add: 't'},function(){})();
  },25);
},
'they should be reported': herr(function(data){
  assert.deepEqual(data, [
      {add_shape: { t: 1, r: 0, g: 25, b: 250, a: 0,
      p: [[1,2],[3,4],[5,6]],id:0}}
    ]);
}),
'and when we delete shapes': {
topic: function(){
  getJSON({page: 'http://streaming-test//', stream: 1}, this.callback)();
  setTimeout(function(){
    getJSON({page: 'http://streaming-test//',
      t: 1, r: 0, g: 25, b: 250, a: 0,
      p: "1,2;3,4;5,6;",del: 't'},function(){})();
  },25);
},
  'we should notice that too': herr(function(data){
    assert.deepEqual(data, [
        {delete_shape: { t: 1, r: 0, g: 25, b: 250, a: 0,
        p: [[1,2],[3,4],[5,6]] }}
      ]);
  })
}
},


'that is streaming forever': {
topic: function(){
  var promise = new events.EventEmitter();
  getJSON({page: 'http://streaming-forever-test//', stream: 0}, function(err,data) {
        promise.emit('success', data);
      })();
  return promise;
},
'should eventually time out': herr(function(data) {
  assert.deepEqual(data, []);
})
}

}
}).addBatch({
    'The server': {
      topic: com.getTestServer(),
      'can be stopped.': function(svr){
        svr.close();
      }
    }
}).export(module);
