"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "checkAddress", {
  enumerable: true,
  get: function get() {
    return _check.default;
  }
});
Object.defineProperty(exports, "decodeAddress", {
  enumerable: true,
  get: function get() {
    return _decode.default;
  }
});
Object.defineProperty(exports, "encodeAddress", {
  enumerable: true,
  get: function get() {
    return _encode.default;
  }
});
Object.defineProperty(exports, "setSS58Format", {
  enumerable: true,
  get: function get() {
    return _setSS58Format.default;
  }
});

var _check = _interopRequireDefault(require("./check"));

var _decode = _interopRequireDefault(require("./decode"));

var _encode = _interopRequireDefault(require("./encode"));

var _setSS58Format = _interopRequireDefault(require("./setSS58Format"));