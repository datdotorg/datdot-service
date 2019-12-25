"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  cryptoWaitReady: true
};
exports.cryptoWaitReady = cryptoWaitReady;

require("./polyfill");

var _wasmCrypto = _interopRequireDefault(require("@polkadot/wasm-crypto"));

var _address = require("./address");

Object.keys(_address).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _address[key];
    }
  });
});

var _blake = require("./blake2");

Object.keys(_blake).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _blake[key];
    }
  });
});

var _keccak = require("./keccak");

Object.keys(_keccak).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _keccak[key];
    }
  });
});

var _key = require("./key");

Object.keys(_key).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _key[key];
    }
  });
});

var _mnemonic = require("./mnemonic");

Object.keys(_mnemonic).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _mnemonic[key];
    }
  });
});

var _nacl = require("./nacl");

Object.keys(_nacl).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _nacl[key];
    }
  });
});

var _random = require("./random");

Object.keys(_random).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _random[key];
    }
  });
});

var _schnorrkel = require("./schnorrkel");

Object.keys(_schnorrkel).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _schnorrkel[key];
    }
  });
});

var _secp256k = require("./secp256k1");

Object.keys(_secp256k).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _secp256k[key];
    }
  });
});

var _sha = require("./sha512");

Object.keys(_sha).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _sha[key];
    }
  });
});

var _xxhash = require("./xxhash");

Object.keys(_xxhash).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _xxhash[key];
    }
  });
});

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
function cryptoWaitReady() {
  return _wasmCrypto.default.waitReady().then(() => true).catch(error => {
    console.error('Unable to initialize @polkadot/util-crypto', error);
    return false;
  });
} // start init process immediately


cryptoWaitReady().catch(() => {// shouldn't happen, logged above
});