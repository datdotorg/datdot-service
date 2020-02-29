import { DigestItem } from '../interfaces/runtime';
import { AnyJson, Registry } from '../types';
import Struct from '../codec/Struct';
import Vec from '../codec/Vec';
/**
 * @name Digest
 * @description
 * A [[Header]] Digest
 */
export default class Digest extends Struct {
    constructor(registry: Registry, value: any);
    /**
     * @description The [[DigestItem]] logs
     */
    get logs(): Vec<DigestItem>;
    /**
     * @description The [[DigestItem]] logs, filtered, filter items included. This is useful for derive functionality where only a certain type of log is to be returned.
     */
    logsWith(...include: string[]): Vec<DigestItem>;
    /**
     * @description The [[DigestItem]] logs, filtered, filter items exluded. This is useful for stripping headers for eg. WASM runtime execution.
     */
    logsWithout(...exclude: string[]): Vec<DigestItem>;
    /**
     * @desrcript The JSON representation as it goes over RPC
     */
    toJSON(): AnyJson;
}
