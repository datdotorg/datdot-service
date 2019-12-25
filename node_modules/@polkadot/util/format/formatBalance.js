"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toBn = _interopRequireDefault(require("../bn/toBn"));

var _boolean = _interopRequireDefault(require("../is/boolean"));

var _undefined = _interopRequireDefault(require("../is/undefined"));

var _formatDecimal = _interopRequireDefault(require("./formatDecimal"));

var _si = require("./si");

// Copyright 2017-2019 @polkadot/util authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
const DEFAULT_DECIMALS = 0;
const DEFAULT_UNIT = _si.SI[_si.SI_MID].text;
let defaultDecimals = DEFAULT_DECIMALS;
let defaultUnit = DEFAULT_UNIT; // Formats a string/number with <prefix>.<postfix><type> notation

function _formatBalance(input) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  let decimals = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultDecimals;
  let text = (0, _toBn.default)(input).toString();

  if (text.length === 0 || text === '0') {
    return '0';
  } // strip the negative sign so we can work with clean groupings, re-add this in the
  // end when we return the result (from here on we work with positive numbers)


  const isNegative = text[0].startsWith('-');

  if (isNegative) {
    text = text.substr(1);
  } // extract options - the boolean case is for backwards-compat


  const {
    forceUnit = undefined,
    withSi = true
  } = (0, _boolean.default)(options) ? {
    withSi: options
  } : options; // NOTE We start at midpoint (8) minus 1 - this means that values display as
  // 123.456 instead of 0.123k (so always 6 relevant). Additionally we us ceil
  // so there are at most 3 decimal before the decimal seperator

  const si = (0, _si.calcSi)(text, decimals, forceUnit);
  const mid = text.length - (decimals + si.power);
  const prefix = text.substr(0, mid);
  const padding = mid < 0 ? 0 - mid : 0;
  const postfix = "".concat("".concat(new Array(padding + 1).join('0')).concat(text).substr(mid < 0 ? 0 : mid), "000").substr(0, 3);
  const units = withSi ? si.value === '-' ? " ".concat(si.text) : "".concat(si.value, " ").concat(_si.SI[_si.SI_MID].text) : '';
  return "".concat(isNegative ? '-' : '').concat((0, _formatDecimal.default)(prefix || '0'), ".").concat(postfix).concat(units);
}

const formatBalance = _formatBalance; // eslint-disable-next-line @typescript-eslint/unbound-method

formatBalance.calcSi = function (text) {
  let decimals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultDecimals;
  return (0, _si.calcSi)(text, decimals);
}; // eslint-disable-next-line @typescript-eslint/unbound-method


formatBalance.findSi = _si.findSi; // eslint-disable-next-line @typescript-eslint/unbound-method

formatBalance.getDefaults = () => {
  return {
    decimals: defaultDecimals,
    unit: defaultUnit
  };
}; // get allowable options to display in a dropdown
// eslint-disable-next-line @typescript-eslint/unbound-method


formatBalance.getOptions = function () {
  let decimals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultDecimals;
  return _si.SI.filter((_ref) => {
    let {
      power
    } = _ref;
    return power < 0 ? decimals + power >= 0 : true;
  });
}; // Sets the default decimals to use for formatting (ui-wide)
// eslint-disable-next-line @typescript-eslint/unbound-method


formatBalance.setDefaults = (_ref2) => {
  let {
    decimals,
    unit
  } = _ref2;
  defaultDecimals = (0, _undefined.default)(decimals) ? defaultDecimals : decimals;
  defaultUnit = (0, _undefined.default)(unit) ? defaultUnit : unit;
  _si.SI[_si.SI_MID].text = defaultUnit;
};

var _default = formatBalance;
exports.default = _default;