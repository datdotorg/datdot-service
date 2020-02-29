declare const _default: {
    isDeprecated: boolean;
    isHidden: boolean;
    description: string;
    section: string;
    methods: {
        call: import("./types").RpcMethod;
        getChildKeys: import("./types").RpcMethod;
        getChildStorage: import("./types").RpcMethod;
        getChildStorageHash: import("./types").RpcMethod;
        getChildStorageSize: import("./types").RpcMethod;
        getKeys: import("./types").RpcMethod;
        getMetadata: import("./types").RpcMethod;
        getRuntimeVersion: import("./types").RpcMethod;
        getStorage: import("./types").RpcMethod;
        getStorageHash: import("./types").RpcMethod;
        getStorageSize: import("./types").RpcMethod;
        queryStorage: import("./types").RpcMethod;
        subscribeRuntimeVersion: import("./types").RpcMethod;
        subscribeStorage: import("./types").RpcMethod;
    };
};
/**
 * @summary Query the state and state storage.
 */
export default _default;
