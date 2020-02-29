import { JsonRpcRequest, JsonRpcResponse } from '../types';
/** @internal */
export default class RpcCoder {
    #private;
    decodeResponse(response: JsonRpcResponse): any;
    encodeJson(method: string, params: any | any[]): string;
    encodeObject(method: string, params: any | any[]): JsonRpcRequest;
    getId(): number;
    private checkError;
}
