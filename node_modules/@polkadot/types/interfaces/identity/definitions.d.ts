declare const _default: {
    types: {
        IdentityFields: {
            _set: {
                _bitLength: number;
                Display: number;
                Legal: number;
                Web: number;
                Riot: number;
                Email: number;
                PgpFingerprint: number;
                Image: number;
                Twitter: number;
            };
        };
        IdentityInfoAdditional: string;
        IdentityInfo: {
            additional: string;
            display: string;
            legal: string;
            web: string;
            riot: string;
            email: string;
            pgpFingerprint: string;
            image: string;
            twitter: string;
        };
        IdentityJudgement: {
            _enum: {
                Unknown: string;
                FeePaid: string;
                Reasonable: string;
                KnownGood: string;
                OutOfDate: string;
                LowQuality: string;
                Erroneous: string;
            };
        };
        RegistrationJudgement: string;
        Registration: {
            judgements: string;
            deposit: string;
            info: string;
        };
        RegistrarIndex: string;
        RegistrarInfo: {
            account: string;
            fee: string;
            fields: string;
        };
    };
};
export default _default;
