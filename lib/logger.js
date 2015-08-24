var debug = require("debug");

/**
 * Wrap an express middlware logging when it is called/errored/complete
 * @param {String}    label       name of middleware
 * @param {Function}  middleware  an express middleware with (req, res, next) signature
 * @returns {Function} the wrapped middleware
 */
function logMiddlware (label, middleware) {
  var debugLog = debug("middleware:" + label);
  return function (req, res, next) {
    debugLog("started");
    var newNext = function (err) {
      if (err) {
        debugLog(err);
      } else {
        debugLog("complete");
      }
      next(err);
    };

    var ret = middleware.call(this, req, res, newNext);

    return ret;
  };

}

module.exports = logMiddlware;
