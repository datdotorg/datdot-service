"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toJson;

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

// Copyright 2017-2019 @polkadot/keyring authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
function toJson(type, _ref, encoded, isEncrypted) {
  let {
    publicKey,
    meta
  } = _ref;
  return {
    address: (0, _utilCrypto.encodeAddress)(publicKey),
    encoded: (0, _util.u8aToHex)(encoded),
    encoding: {
      content: ['pkcs8', type],
      type: isEncrypted ? 'xsalsa20-poly1305' : 'none',
      version: '2'
    },
    meta
  };
}