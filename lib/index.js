var logger = require("./logger");
var middlewares = [];

/**
 * Check if a middleware should be included
 * @param {Object} routeObject       the route object
 * @param {Object} middlewareObject  the middleware object
 * @returns {Boolean} wether or not the middleware should be included
 */
function shouldAddMiddleware(routeObject, middlewareObject) {
  return middlewareObject.include && (
    middlewareObject.include.indexOf("all") >= 0 ||
    middlewareObject.include.indexOf(routeObject.method) >= 0
  );
}

/**
 * add a middleware to run through
 * @param {Function} middlewareObject             function which takes a configuration object
 * @param {String}   middlewareObject.name        name of midleware to match route object keys
 * @param {String}   middlewareObject.include     what type of requests to include middleware in
 * @param {Function} middlewareObject.generator   function returning an express; middleware
 * @returns {Router} express router with middlewares configured
 */
function addMiddleware (middlewareObject) {
  if (!middlewareObject || typeof middlewareObject !== "object") {
    throw new Error("addMiddleware: middlewareObject must be an object");
  }
  if (!middlewareObject.name || typeof middlewareObject.name !== "string") {
    throw new Error("addMiddleware: name required");
  }
  if (!middlewareObject.generator || typeof middlewareObject.generator !== "function") {
    throw new Error("addMiddleware: middlewareObject.generator must be a function");
  }
  if (middlewareObject.include) {
    middlewareObject.include = [].concat(middlewareObject.include);
  }
  middlewares.push(middlewareObject);
}

/**
 * getMiddlewares
 * @returns {Array} array of middlewareObjects containing all middlewares
 */
function getMiddlewares () {
  return middlewares;
}

/**
 * getMiddlewares
 * @param {Array} middlewareObjects   array of middlewareObjects
 * @returns {Object} object containing all middlewares
 */
function setMiddlewares (middlewareObjects) {
  if (!Array.isArray(middlewareObjects)) {
    throw new Error("setMiddleware: middlewareObjects should be an Array");
  }
  middlewareObjects.forEach(function (middlewareObject) {
    addMiddleware(middlewareObject);
  });
}

/**
 * build a set of middlware given a route object
 * @param {Object}   routeObject        route object
 * @returns {Array} middleware array
 */
function buildMiddlewares (routeObject) {
  var routeMiddlewares = [];

  if (!routeObject.path) {
    throw new Error("route object requires a 'path' attribute");
  }

  if (!routeObject.method) {
    throw new Error("route object requires a 'methods' attribute");
  }

  // path such as '/fish' must go first as express expects
  // router.get('/:pearlId', middleware1, middleware2)
  routeMiddlewares.push(routeObject.path);

  middlewares.forEach(function (middlewareObject) {
    var name = middlewareObject.name;

    if (middlewareObject.include === "required" && !routeObject.hasOwnProperty(name)) {
      throw new Error("" + name + " is a required configuration");
    }

    if (shouldAddMiddleware(routeObject, middlewareObject) || routeObject.hasOwnProperty(name)) {
      routeMiddlewares.push(
        logger(name, middlewareObject.generator(routeObject[name]))
      );
    }
  });

  return routeMiddlewares;
}

/**
 * Generate a router from an array of routeObjects
 * @param   {Object}          router            express router
 * @param   {Array}           routeObjects      route configuration to build into a router
 * @returns {express.Router}              express router object
 */
function buildRouter (router, routeObjects) {
  routeObjects.forEach(function (routeObject) {
    if (!routeObject.method) {
      throw new Error("routeObject requires a 'method' object");
    }

    var routeMiddlewares = buildMiddlewares(routeObject);

    // Register the middleware on the router
    router[routeObject.method.toLowerCase()].apply(router, routeMiddlewares);
  });

  return router;
}

module.exports = {
  addMiddleware: addMiddleware,
  buildRouter: buildRouter,
  buildMiddlewares: buildMiddlewares,
  getMiddlewares: getMiddlewares,
  setMiddlewares: setMiddlewares
};
