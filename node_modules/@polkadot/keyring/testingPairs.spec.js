"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _utilCrypto = require("@polkadot/util-crypto");

var _testingPairs = _interopRequireDefault(require("./testingPairs"));

// Copyright 2017-2019 @polkadot/keyring authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('testingPairs', () => {
  beforeEach(async () => {
    await (0, _utilCrypto.cryptoWaitReady)();
  });
  it('creates without failing', () => {
    expect(Object.keys((0, _testingPairs.default)())).toHaveLength(2 + 1 + 7);
  });
  it('has the correct address for Alice (non-HDKD)', () => {
    expect((0, _testingPairs.default)({
      type: 'ed25519'
    }, false).alice.address).toEqual('5GoKvZWG5ZPYL1WUovuHW3zJBWBP5eT8CbqjdRY4Q6iMaQua');
  });
  it('has the correct address for Alice (HDKD)', () => {
    expect((0, _testingPairs.default)({
      type: 'ed25519'
    }).alice.address).toEqual('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
  });
  it('has the correct address for Alice_session (HDKD)', () => {
    expect((0, _testingPairs.default)({
      type: 'ed25519'
    }).alice_session.address).toEqual('5FA9nQDVg267DEd8m1ZypXLBnvN7SFxYwV7ndqSYGiN9TTpu');
  });
});