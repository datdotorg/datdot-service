"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = decode;

var _bs = _interopRequireDefault(require("bs58"));

var _util = require("@polkadot/util");

var _defaults = _interopRequireDefault(require("./defaults"));

var _sshash = _interopRequireDefault(require("./sshash"));

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
// Original implementation: https://github.com/paritytech/polka-ui/blob/4858c094684769080f5811f32b081dd7780b0880/src/polkadot.js#L6
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decode(encoded, ignoreChecksum) {
  let ss58Format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 99;

  if ((0, _util.isU8a)(encoded) || (0, _util.isHex)(encoded)) {
    return (0, _util.u8aToU8a)(encoded);
  }

  const decoded = (0, _util.bufferToU8a)(_bs.default.decode(encoded));

  const error = message => "Decoding ".concat(encoded, ": ").concat(message); // assert(defaults.allowedPrefix.includes(decoded[0] as Prefix), error('Invalid decoded address prefix'));


  (0, _util.assert)(_defaults.default.allowedEncodedLengths.includes(decoded.length), error('Invalid decoded address length')); // TODO Unless it is an "use everywhere" prefix, throw an error
  // if (decoded[0] !== prefix) {
  //   console.log(`WARN: Expected ${prefix}, found ${decoded[0]}`);
  // }

  const isPublicKey = decoded.length === 35; // non-publicKeys has 1 byte checksums, else default to 2

  const endPos = decoded.length - (isPublicKey ? 2 : 1); // calculate the hash and do the checksum byte checks

  const hash = (0, _sshash.default)(decoded.subarray(0, endPos));
  const checks = isPublicKey ? decoded[decoded.length - 2] === hash[0] && decoded[decoded.length - 1] === hash[1] : decoded[decoded.length - 1] === hash[0];
  (0, _util.assert)(ignoreChecksum || checks, error('Invalid decoded address checksum'));
  return decoded.slice(1, endPos);
}