declare const _default: {
    types: {
        AccountData: {
            free: string;
            reserved: string;
            miscFrozen: string;
            feeFrozen: string;
        };
        BalanceLockTo212: {
            id: string;
            amount: string;
            until: string;
            reasons: string;
        };
        BalanceLock: {
            id: string;
            amount: string;
            reasons: string;
        };
        Reasons: {
            _enum: string[];
        };
        VestingSchedule: {
            offset: string;
            perBlock: string;
            startingBlock: string;
        };
        WithdrawReasons: {
            _set: {
                TransactionPayment: number;
                Transfer: number;
                Reserve: number;
                Fee: number;
                Tip: number;
            };
        };
    };
};
export default _default;
