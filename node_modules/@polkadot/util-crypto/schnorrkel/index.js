"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "schnorrkelDeriveHard", {
  enumerable: true,
  get: function get() {
    return _deriveHard.default;
  }
});
Object.defineProperty(exports, "schnorrkelDeriveSoft", {
  enumerable: true,
  get: function get() {
    return _deriveSoft.default;
  }
});
Object.defineProperty(exports, "schnorrkelKeypairFromSeed", {
  enumerable: true,
  get: function get() {
    return _fromSeed.default;
  }
});
Object.defineProperty(exports, "schnorrkelSign", {
  enumerable: true,
  get: function get() {
    return _sign.default;
  }
});
Object.defineProperty(exports, "schnorrkelVerify", {
  enumerable: true,
  get: function get() {
    return _verify.default;
  }
});

require("../polyfill");

var _deriveHard = _interopRequireDefault(require("./deriveHard"));

var _deriveSoft = _interopRequireDefault(require("./deriveSoft"));

var _fromSeed = _interopRequireDefault(require("./keypair/fromSeed"));

var _sign = _interopRequireDefault(require("./sign"));

var _verify = _interopRequireDefault(require("./verify"));