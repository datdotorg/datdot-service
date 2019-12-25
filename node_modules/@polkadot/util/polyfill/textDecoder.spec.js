"use strict";

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('TextDecoder', () => {
  let origTD;
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    origTD = global.TextDecoder;
  });
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextDecoder = origTD;
  });
  it('polyfills with no exceptions (without TextDecoder)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextDecoder = null; // eslint-disable-next-line @typescript-eslint/no-var-requires

    expect(require('./textDecoder')).toBeDefined(); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect(global.TextDecoder).toBeDefined();
  });
  it('polyfills with no exceptions (with TextDecoder)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextDecoder = require('util').TextDecoder; // eslint-disable-next-line @typescript-eslint/no-var-requires

    expect(require('./textDecoder')).toBeDefined(); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect(global.TextDecoder).toBeDefined();
  });
});