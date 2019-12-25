declare const _default: {
    isDeprecated: boolean;
    isHidden: boolean;
    description: string;
    section: string;
    methods: {
        chain: import("./types").RpcMethod;
        health: import("./types").RpcMethod;
        name: import("./types").RpcMethod;
        networkState: import("./types").RpcMethod;
        peers: import("./types").RpcMethod;
        properties: import("./types").RpcMethod;
        version: import("./types").RpcMethod;
    };
};
/**
 * @summary Calls to retrieve system info.
 */
export default _default;
