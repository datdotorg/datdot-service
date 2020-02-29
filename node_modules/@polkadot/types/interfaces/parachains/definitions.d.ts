declare const _default: {
    types: {
        AttestedCandidate: {
            candidate: string;
            validityVotes: string;
            validatorIndices: string;
        };
        AuctionIndex: string;
        Bidder: {
            _enum: {
                New: string;
                Existing: string;
            };
        };
        CandidateReceipt: {
            parachainIndex: string;
            collator: string;
            signature: string;
            headData: string;
            egressQueueRoots: string;
            fees: string;
            blockDataHash: string;
            upwardMessages: string;
            erasureRoot: string;
        };
        CollatorId: string;
        CollatorSignature: string;
        EgressQueueRoot: string;
        HeadData: string;
        IncomingParachainDeploy: {
            code: string;
            initialHeadData: string;
        };
        IncomingParachainFixed: {
            codeHash: string;
            initialHeadData: string;
        };
        IncomingParachain: {
            _enum: {
                Unset: string;
                Fixed: string;
                Deploy: string;
            };
        };
        LeasePeriod: string;
        LeasePeriodOf: string;
        NewBidder: {
            who: string;
            sub: string;
        };
        ParaId: string;
        ParaIdOf: string;
        ParaInfo: {
            scheduling: string;
        };
        ParachainDispatchOrigin: {
            _enum: string[];
        };
        ParaScheduling: {
            _enum: string[];
        };
        Retriable: {
            _enum: {
                Never: string;
                WithRetries: string;
            };
        };
        SlotRange: {
            _enum: string[];
        };
        SubId: string;
        UpwardMessage: {
            origin: string;
            data: string;
        };
        ValidityAttestation: {
            _enum: {
                None: string;
                Implicit: string;
                Explicit: string;
            };
        };
        WinningDataEntry: string;
        WinningData: string;
    };
};
export default _default;
