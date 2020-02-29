declare const _default: {
    types: {
        Bid: {
            who: string;
            kind: string;
            value: string;
        };
        BidKindVouch: string;
        BidKind: {
            _enum: {
                Deposit: string;
                Vouch: string;
            };
        };
        SocietyJudgement: {
            _enum: string[];
        };
        SocietyVote: {
            _enum: string[];
        };
        StrikeCount: string;
        VouchingStatus: {
            _enum: string[];
        };
    };
};
export default _default;
