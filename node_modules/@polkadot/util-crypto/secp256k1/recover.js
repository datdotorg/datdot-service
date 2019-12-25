"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = secp256k1Recover;

var _secp256k = _interopRequireDefault(require("secp256k1"));

var _util = require("@polkadot/util");

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/**
 * @name secp256k1Recover
 * @description Recovers a publicKey from the supplied signature
 */
function secp256k1Recover(message, signature, recovery) {
  return (0, _util.u8aToU8a)(_secp256k.default.recover((0, _util.u8aToBuffer)(message), (0, _util.u8aToBuffer)(signature), recovery));
}