import { AnyFunction } from '@polkadot/types/types';
import { ApiTypes, MethodResult } from './base';
export declare type DecoratedRpcSection<ApiType extends ApiTypes, Section> = {
    [Method in keyof Section]: Section[Method] extends AnyFunction ? MethodResult<ApiType, Section[Method]> : never;
};
export declare type DecoratedRpc<ApiType extends ApiTypes, AllSections> = {
    [Section in keyof AllSections]: DecoratedRpcSection<ApiType, AllSections[Section]>;
};
