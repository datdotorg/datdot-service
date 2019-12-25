"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = keyFromPath;

var _hdkdEd = _interopRequireDefault(require("./hdkdEd25519"));

var _hdkdSr = _interopRequireDefault(require("./hdkdSr25519"));

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
function keyFromPath(pair, path, type) {
  const isEd25519 = type === 'ed25519';
  return path.reduce((pair, junction) => {
    return isEd25519 ? (0, _hdkdEd.default)(pair, junction) : (0, _hdkdSr.default)(pair, junction);
  }, pair);
}