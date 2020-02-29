import { KeypairType } from '@polkadot/util-crypto/types';
import { KeyringPair$Json, KeyringPair$Meta } from '../types';
declare type PairStateJson = KeyringPair$Meta & {
    publicKey: Uint8Array;
};
export default function toJson(type: KeypairType, { publicKey, meta }: PairStateJson, encoded: Uint8Array, isEncrypted: boolean): KeyringPair$Json;
export {};
