import { ReferendumIndex, ReferendumInfo } from '@polkadot/types/interfaces/democracy';
import { AnyJson, Constructor, Registry } from '@polkadot/types/types';
import BN from 'bn.js';
declare const _ReferendumInfo: Constructor<ReferendumInfo>;
/**
 * @name ReferendumInfoExtended
 * @description
 * A [[ReferendumInfo]] with an additional `index` field
 */
export default class ReferendumInfoExtended extends _ReferendumInfo {
    #private;
    constructor(registry: Registry, value: ReferendumInfo | ReferendumInfoExtended, index?: BN | number);
    /**
     * @description Convenience getter, returns the referendumIndex
     */
    get index(): ReferendumIndex;
    /**
     * @description Creates a human-friendly JSON representation
     */
    toHuman(isExtended?: boolean): AnyJson;
    /**
     * @description Creates the JSON representation
     */
    toJSON(): AnyJson;
}
export {};
