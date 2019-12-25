"use strict";

/* eslint-disable @typescript-eslint/unbound-method */
// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('String padStart', () => {
  let stringStart;
  beforeEach(() => {
    stringStart = String.prototype.padStart; // eslint-disable-next-line no-extend-native,@typescript-eslint/no-explicit-any

    String.prototype.padStart = null;

    require('./padStart');
  });
  afterEach(() => {
    // eslint-disable-next-line no-extend-native
    String.prototype.padStart = stringStart;
  });
  it('does padding', () => {
    expect('test'.padStart(8, 'A')).toEqual('AAAAtest');
    expect('test'.padStart(8)).toEqual('    test');
  });
});