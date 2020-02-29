import { Callback } from '@polkadot/types/types';
import { UnsubscribePromise } from '../types';
export declare type CombinatorCallback = Callback<any[]>;
export interface CombinatorFunction {
    (cb: Callback<any>): UnsubscribePromise;
}
export default class Combinator {
    #private;
    constructor(fns: (CombinatorFunction | [CombinatorFunction, ...any[]])[], callback: CombinatorCallback);
    protected allHasFired(): boolean;
    protected createCallback(index: number): (value: any) => void;
    protected triggerUpdate(): void;
    unsubscribe(): void;
}
