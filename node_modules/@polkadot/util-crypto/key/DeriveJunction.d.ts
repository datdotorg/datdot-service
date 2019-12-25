import BN from 'bn.js';
export default class DeriveJunction {
    private _chainCode;
    private _isHard;
    static from(value: string): DeriveJunction;
    get chainCode(): Uint8Array;
    get isHard(): boolean;
    get isSoft(): boolean;
    hard(value: number | BN | string | Uint8Array): DeriveJunction;
    harden(): DeriveJunction;
    soft(value: number | BN | string | Uint8Array): DeriveJunction;
    soften(): DeriveJunction;
}
