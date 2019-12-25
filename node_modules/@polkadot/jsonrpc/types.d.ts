import { InterfaceTypes } from '@polkadot/types/types';
declare type PubSub = [string, string, string];
export interface RpcParam {
    isOptional: boolean;
    name: string;
    type: InterfaceTypes;
}
export interface RpcMethodOpt {
    description: string;
    isDeprecated?: boolean;
    isHidden?: boolean;
    isOptional?: boolean;
    isSigned?: boolean;
    isSubscription?: boolean;
    params: RpcParam[];
    pubsub?: PubSub;
    type: InterfaceTypes;
}
export interface RpcMethod {
    alias?: string;
    description: string;
    isDeprecated: boolean;
    isHidden: boolean;
    isOptional: boolean;
    isSigned: boolean;
    isSubscription: boolean;
    method: string;
    params: RpcParam[];
    pubsub: PubSub;
    section: string;
    type: InterfaceTypes;
}
export interface RpcSection {
    isDeprecated: boolean;
    isHidden: boolean;
    description: string;
    section: string;
    methods: Record<string, RpcMethod>;
}
export {};
