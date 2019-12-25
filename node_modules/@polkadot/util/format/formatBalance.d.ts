import { SiDef, ToBn } from '../types';
import BN from 'bn.js';
interface Defaults {
    decimals: number;
    unit: string;
}
declare type Options = boolean | {
    forceUnit?: string;
    withSi?: boolean;
};
interface BalanceFormatter {
    <ExtToBn extends ToBn>(input?: number | string | BN | ExtToBn, options?: Options, decimals?: number): string;
    calcSi(text: string, decimals?: number): SiDef;
    findSi(type: string): SiDef;
    getDefaults(): Defaults;
    getOptions(decimals?: number): SiDef[];
    setDefaults(defaults: Partial<Defaults>): void;
}
declare const formatBalance: BalanceFormatter;
export default formatBalance;
