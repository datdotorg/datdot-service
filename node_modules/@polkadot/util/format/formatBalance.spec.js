"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _bn = _interopRequireDefault(require("bn.js"));

var _formatBalance = _interopRequireDefault(require("./formatBalance"));

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
describe('formatBalance', () => {
  const TESTVAL = new _bn.default('123456789000');
  describe('SI formatting', () => {
    it('formats empty to 0', () => {
      expect((0, _formatBalance.default)()).toEqual('0');
      expect((0, _formatBalance.default)('0')).toEqual('0');
    });
    it('formats 123,456,789,000 (decimals=15)', () => {
      expect((0, _formatBalance.default)(TESTVAL, true, 15)).toEqual('123.456µ Unit');
    });
    it('formats 123,456,789,000 (decimals=36)', () => {
      expect((0, _formatBalance.default)(TESTVAL, true, 36)).toEqual('0.123y Unit');
    });
    it('formats 123,456,789,000 (decimals=15, Compact)', () => {
      const compact = {
        toBn: () => TESTVAL,
        unwrap: () => TESTVAL,
        something: 'else'
      };
      expect((0, _formatBalance.default)(compact, true, 15)).toEqual('123.456µ Unit');
    });
    it('formats 123,456,789,000 (decimals=12)', () => {
      expect((0, _formatBalance.default)(TESTVAL, true, 12)).toEqual('123.456m Unit');
    });
    it('formats 123,456,789,000 (decimals=12, no SI)', () => {
      expect((0, _formatBalance.default)(TESTVAL, false, 12)).toEqual('123.456');
    });
    it('formats 123,456,789,000 (decimals=9)', () => {
      expect((0, _formatBalance.default)(TESTVAL, true, 9)).toEqual('123.456 Unit');
    });
    it('formats 123,456,789,000 (decimals=6)', () => {
      expect((0, _formatBalance.default)(TESTVAL, true, 6)).toEqual('123.456k Unit');
    });
    it('formats 123,456,789,000 * 10 (decimals=12)', () => {
      expect((0, _formatBalance.default)(TESTVAL.muln(10), true, 12)).toEqual('1.234 Unit');
    });
    it('formats 123,456,789,000 * 100 (decimals=12)', () => {
      expect((0, _formatBalance.default)(TESTVAL.muln(100), true, 12)).toEqual('12.345 Unit');
    });
    it('formats 123,456,789,000 * 1000 (decimals=12)', () => {
      expect((0, _formatBalance.default)(TESTVAL.muln(1000), true, 12)).toEqual('123.456 Unit');
    });
    it('formats -123,456,789,000 (decimals=15)', () => {
      expect((0, _formatBalance.default)(new _bn.default('-123456789000'), true, 15)).toEqual('-123.456µ Unit');
    });
  });
  describe('Forced formatting', () => {
    it('formats 123,456,789,000 (decimals=12, forceUnit=base)', () => {
      expect((0, _formatBalance.default)(TESTVAL, {
        forceUnit: '-'
      }, 12)).toEqual('0.123 Unit');
    });
    it('formats 123,456,789,000 (decimals=9, forceUnit=base)', () => {
      expect((0, _formatBalance.default)(TESTVAL, {
        forceUnit: '-'
      }, 9)).toEqual('123.456 Unit');
    });
    it('formats 123,456,789,000 (decimals=7, forceUnit=base)', () => {
      expect((0, _formatBalance.default)(TESTVAL, {
        forceUnit: '-'
      }, 7)).toEqual('12,345.678 Unit');
    });
    it('formats 123,456,789,000 (decimals=15, forceUnit=µ)', () => {
      expect((0, _formatBalance.default)(TESTVAL, {
        forceUnit: 'µ'
      }, 15)).toEqual('123.456µ Unit');
    });
  });
  describe('calcSi', () => {
    it('exposes calcSi on formatBalance', () => {
      expect(_formatBalance.default.calcSi('12345').value).toEqual('k');
    });
  });
  describe('findSi', () => {
    it('finds the SI value', () => {
      expect(_formatBalance.default.findSi('k')).toEqual({
        power: 3,
        value: 'k',
        text: 'Kilo'
      });
    });
    it('returns default on not found', () => {
      expect(_formatBalance.default.findSi('blah')).toEqual({
        power: 0,
        value: '-',
        text: 'Unit'
      });
    });
  });
  describe('defaults', () => {
    it('returns defaults', () => {
      expect(_formatBalance.default.getDefaults()).toEqual({
        decimals: 0,
        unit: 'Unit'
      });
    });
    it('formats 123,456,789,000 (defaultDecimals=12)', () => {
      _formatBalance.default.setDefaults({
        decimals: 12
      });

      expect((0, _formatBalance.default)(TESTVAL)).toEqual('123.456m Unit');
    });
    it('formats 123,456,789,000 (defaultUnit=TEST)', () => {
      _formatBalance.default.setDefaults({
        unit: 'TEST'
      });

      expect((0, _formatBalance.default)(TESTVAL)).toEqual('123.456m TEST');
    });
  });
  it('returns options for dropdown', () => {
    _formatBalance.default.setDefaults({
      decimals: 0,
      unit: 'TEST'
    });

    expect(_formatBalance.default.getOptions()).toEqual([{
      power: 0,
      value: '-',
      text: 'TEST'
    }, {
      power: 3,
      value: 'k',
      text: 'Kilo'
    }, {
      power: 6,
      value: 'M',
      text: 'Mega'
    }, {
      power: 9,
      value: 'G',
      text: 'Giga'
    }, {
      power: 12,
      value: 'T',
      text: 'Tera'
    }, {
      power: 15,
      value: 'P',
      text: 'Peta'
    }, {
      power: 18,
      value: 'E',
      text: 'Exa'
    }, {
      power: 21,
      value: 'Z',
      text: 'Zeta'
    }, {
      power: 24,
      value: 'Y',
      text: 'Yotta'
    }]);
  });
});