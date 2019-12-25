"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assertSingletonPackage;

var _undefined = _interopRequireDefault(require("./is/undefined"));

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/**
 * @name assertSingletonPackage
 * @summary Checks that a specific package is only imported once
 */
function assertSingletonPackage(name) {
  const _global = typeof window !== 'undefined' ? window : global;

  if (!_global.__polkadotjs) {
    _global.__polkadotjs = {};
  }

  if (!(0, _undefined.default)(_global.__polkadotjs[name])) {
    console.warn("Multiple versions of ".concat(name, " detected, ensure that there is only one version in your dependency tree"));
  }

  _global.__polkadotjs[name] = true;
}