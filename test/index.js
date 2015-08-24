var expressRouteBuilder = require("../");
var expect = require("expect.js");
var express = require("express");

function nullNextFunc () {
  return;
}

var middlewareObjects = [
  {
    name: "pagination",
    include: "get",
    generator: function pagination () {
      return function (req, res, next) {
        //... do pagination
        req.pagination = "pagination";
        next();
      };
    }
  },
  {
    name: "authorization",
    include: "optional",
    generator: function (type) {
      return function (req, res, next) {
        //... do something with authorization types
        req.authorization = type;
        next();
      };
    }
  }
];

describe("express-route-buidler", function () {
  describe("addMiddleware", function () {
    it("should add a middleware to the array", function () {
      var count1 = expressRouteBuilder.getMiddlewares().length;

      expressRouteBuilder.addMiddleware({
        name: "someMiddleware",
        generator: function (req, res, next) {
          return;
        }
      });

      var count2 = expressRouteBuilder.getMiddlewares().length;

      expect(count2).to.equal(count1 + 1);
    });

    it("should throw errors if not given an object", function () {
      try {
        expressRouteBuilder.addMiddleware();
        expect(false);
      } catch (e) {
        expect(e).to.be.an(Error);
      }
    });

    it("should throw errors if object is missing the name", function () {
      try {
        expressRouteBuilder.addMiddleware({
          name: undefined
        });
        expect(false);
      } catch (e) {
        expect(e).to.be.an(Error);
      }
    });

    it("should throw errors if object is missing the generator", function () {
      try {
        expressRouteBuilder.addMiddleware({
          name: "badger"
        });
        expect(false);
      } catch (e) {
        expect(e).to.be.an(Error);
      }
    });
  });

  describe("buildMiddlewares", function () {
    it("should turn middlewares object into wrapped middewares", function () {
      expressRouteBuilder.setMiddlewares(middlewareObjects);

      var route = {
        method: "get",
        path: "/fish",
        authorization: "bearer"
      };

      var middlewares = expressRouteBuilder.buildMiddlewares(route);

      expect(middlewares[0]).to.be.a("string").and.to.equal(route.path);
      expect(middlewares[1]).to.be.a(Function);
      expect(middlewares[2]).to.be.a(Function);

      // Simulate express stack
      var mockReq = {};
      middlewares[1](mockReq, {}, nullNextFunc);
      middlewares[2](mockReq, {}, nullNextFunc);

      expect(mockReq.pagination).to.equal("pagination");
      expect(mockReq.authorization).to.equal(route.authorization);
    });
  });

  describe("buildRouter", function () {
    it("should return an express router", function () {
      expressRouteBuilder.setMiddlewares(middlewareObjects);
      var routes = [
        {
          method: "get",
          path: "/badgers",
          authorization: "bearer"
        },
        {
          method: "post",
          path: "/badgers",
          authorization: "bearer"
        }
      ];
      var router = new express.Router();
      expect(router.stack).to.have.length(0);
      expressRouteBuilder.buildRouter(router, routes);
      expect(router.stack).to.have.length(2);
    });
  });
});
