import BN from 'bn.js';
/**
 * @name min
 * @summary Finds and returns the smallest value in an array of BNs.
 * @example
 * <BR>
 *
 * ```javascript
 * import BN from 'bn.js';
 * import { min } from '@polkadot/util';
 *
 * min([new BN(1), new BN(3), new BN(2)]).toString(); // => '1'
 * ```
 */
export default function min(...items: BN[]): BN;
