"use strict";

var _ = require(".");

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('assertSingletonPackage', () => {
  const NAME = 'assertSingletonPackage';
  it('should not log the first time', () => {
    const spy = jest.spyOn(console, 'warn');
    (0, _.assertSingletonPackage)(NAME);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it('should log the second time', () => {
    const spy = jest.spyOn(console, 'warn');
    (0, _.assertSingletonPackage)(NAME);
    expect(spy).toHaveBeenCalledWith('Multiple versions of assertSingletonPackage detected, ensure that there is only one version in your dependency tree');
    spy.mockRestore();
  });
});