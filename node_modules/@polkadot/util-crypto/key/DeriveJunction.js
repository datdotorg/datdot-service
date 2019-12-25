"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = require("@polkadot/util");

var _asU8a = _interopRequireDefault(require("../blake2/asU8a"));

// Copyright 2017-2019 @polkadot/util-crypto authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
const RE_NUMBER = /^\d+$/;
const JUNCTION_ID_LEN = 32;
const BN_OPTIONS = {
  bitLength: 256,
  isLe: true
};

class DeriveJunction {
  constructor() {
    this._chainCode = new Uint8Array(32);
    this._isHard = false;
  }

  static from(value) {
    const [code, isHard] = value.startsWith('/') ? [value.substr(1), true] : [value, false];
    const result = new DeriveJunction();
    result.soft(RE_NUMBER.test(code) ? parseInt(code, 10) : code);
    return isHard ? result.harden() : result;
  }

  get chainCode() {
    return this._chainCode;
  }

  get isHard() {
    return this._isHard;
  }

  get isSoft() {
    return !this._isHard;
  }

  hard(value) {
    return this.soft(value).harden();
  }

  harden() {
    this._isHard = true;
    return this;
  }

  soft(value) {
    if ((0, _util.isNumber)(value) || (0, _util.isBn)(value)) {
      return this.soft((0, _util.bnToHex)(value, BN_OPTIONS));
    } else if ((0, _util.isString)(value)) {
      return (0, _util.isHex)(value) ? this.soft((0, _util.hexToU8a)(value)) : this.soft((0, _util.compactAddLength)((0, _util.stringToU8a)(value)));
    }

    if (value.length > JUNCTION_ID_LEN) {
      return this.soft((0, _asU8a.default)(value));
    }

    this._chainCode.fill(0);

    this._chainCode.set(value, 0);

    return this;
  }

  soften() {
    this._isHard = false;
    return this;
  }

}

exports.default = DeriveJunction;