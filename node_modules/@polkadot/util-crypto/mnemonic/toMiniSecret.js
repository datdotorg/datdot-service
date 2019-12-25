"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toMiniSecret;

require("../polyfill");

var _pbkdf = require("pbkdf2");

var _util = require("@polkadot/util");

var _wasmCrypto = require("@polkadot/wasm-crypto");

var _toEntropy = _interopRequireDefault(require("./toEntropy"));

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
function toMiniSecret(mnemonic) {
  let password = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if ((0, _wasmCrypto.isReady)()) {
    return (0, _wasmCrypto.bip39ToMiniSecret)(mnemonic, password);
  }

  const entropy = (0, _util.u8aToBuffer)((0, _toEntropy.default)(mnemonic));
  const salt = (0, _util.u8aToBuffer)((0, _util.stringToU8a)("mnemonic".concat(password))); // return the first 32 bytes as the seed

  return (0, _util.bufferToU8a)((0, _pbkdf.pbkdf2Sync)(entropy, salt, 2048, 64, 'sha512')).slice(0, 32);
}