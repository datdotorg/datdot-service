declare const _default: {
    types: {
        AssetOptions: {
            initalIssuance: string;
            permissions: string;
        };
        Owner: {
            _enum: {
                None: string;
                Address: string;
            };
        };
        PermissionsV1: {
            update: string;
            mint: string;
            burn: string;
        };
        PermissionVersions: {
            _enum: {
                V1: string;
            };
        };
        PermissionLatest: string;
    };
};
export default _default;
