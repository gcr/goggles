// async_lock.js -- locking for the continuation-based world
//
// these locks are completely toxin-free, non-carcinogenic, and help with
// asynchronous locking even with just one thread.
function AsyncLock() {
  this.locked = false;
  this.ops = [];
}

AsyncLock.prototype.lock = function(action) {
  // will call action(unlock) where unlock is a function that action can call
  // to tell us that it is done.
  //
  // WARNING WARNING WARNING! IF YOU DO NOT CALL UNLOCK, THE LOCK WILL REMAIN
  // LOCKED. Ensure that ALL code paths eventually call unlock or you WILL run
  // into troubles.
  console.log("Lock");
  var self = this;
  this.ops.push(action);
  if (!this.locked) {
    this.locked = true;
    // run each action in action.
    (function unlockOrRunNext() {
        if (self.ops.length===0) {
          // Done!
          self.locked = false;
          console.log("Unlock");
        } else {
          // call the first action, passing in runNext
          self.ops.shift()(unlockOrRunNext);
        }
      })();
  }
};

exports.AsyncLock = AsyncLock;
