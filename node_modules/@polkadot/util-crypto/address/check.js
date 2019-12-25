"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = check;

var _bs = _interopRequireDefault(require("bs58"));

var _defaults = _interopRequireDefault(require("./defaults"));

var _sshash = _interopRequireDefault(require("./sshash"));

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
function check(address, prefix) {
  const decoded = _bs.default.decode(address);

  if (decoded[0] !== prefix) {
    return [false, "Prefix mismatch, expected ".concat(prefix, ", found ").concat(decoded[0])];
  } else if (!_defaults.default.allowedEncodedLengths.includes(decoded.length)) {
    return [false, 'Invalid decoded address length'];
  }

  const isPublicKey = decoded.length === 35; // non-publicKeys has 1 byte checksums, else default to 2

  const endPos = decoded.length - (isPublicKey ? 2 : 1); // calculate the hash and do the checksum byte checks

  const hash = (0, _sshash.default)(decoded.subarray(0, endPos));
  const checks = isPublicKey ? decoded[decoded.length - 2] === hash[0] && decoded[decoded.length - 1] === hash[1] : decoded[decoded.length - 1] === hash[0];
  return !checks ? [false, 'Invalid decoded address checksum'] : [true, null];
}