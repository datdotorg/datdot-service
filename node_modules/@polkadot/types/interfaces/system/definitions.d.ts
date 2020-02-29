declare const _default: {
    types: {
        AccountInfo: {
            nonce: string;
            refcount: string;
            data: string;
        };
        DigestOf: string;
        DispatchError: {
            _enum: {
                Other: string;
                CannotLookup: string;
                BadOrigin: string;
                Module: string;
            };
        };
        DispatchErrorModule: {
            index: string;
            error: string;
        };
        DispatchErrorTo198: {
            module: string;
            error: string;
        };
        DispatchResult: string;
        DispatchResultOf: string;
        DispatchResultTo198: string;
        Event: string;
        EventId: string;
        EventIndex: string;
        EventRecord: {
            phase: string;
            event: string;
            topics: string;
        };
        EventRecordTo76: {
            phase: string;
            event: string;
        };
        Key: string;
        Phase: {
            _enum: {
                ApplyExtrinsic: string;
                Finalization: string;
            };
        };
        RefCount: string;
    };
};
export default _default;
