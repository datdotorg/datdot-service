declare const _default: {
    types: {
        AuthorityIndex: string;
        AuthorityList: string;
        AuthorityWeight: string;
        NextAuthority: string;
        PendingPause: {
            scheduledAt: string;
            delay: string;
        };
        PendingResume: {
            scheduledAt: string;
            delay: string;
        };
        SetId: string;
        StoredPendingChange: {
            scheduledAt: string;
            delay: string;
            nextAuthorities: string;
        };
        StoredState: {
            _enum: {
                Live: string;
                PendingPause: string;
                Paused: string;
                PendingResume: string;
            };
        };
    };
};
export default _default;
