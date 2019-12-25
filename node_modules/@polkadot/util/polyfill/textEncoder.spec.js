"use strict";

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('TextEncoder', () => {
  let origTE;
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    origTE = global.TextEncoder;
  });
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextEncoder = origTE;
  });
  it('polyfills with no exceptions (without TextEncoder)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextEncoder = null; // eslint-disable-next-line @typescript-eslint/no-var-requires

    expect(require('./textEncoder')).toBeDefined(); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect(global.TextEncoder).toBeDefined();
  });
  it('polyfills with no exceptions (with TextEncoder)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.TextEncoder = require('util').TextEncoder; // eslint-disable-next-line @typescript-eslint/no-var-requires

    expect(require('./textEncoder')).toBeDefined(); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect(global.TextEncoder).toBeDefined();
  });
});