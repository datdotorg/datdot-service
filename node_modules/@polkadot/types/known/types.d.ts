import { RegistryTypes } from '../types';
export interface OverrideVersionedType {
    minmax: [number?, number?];
    types: RegistryTypes;
}
export declare type OverrideModuleType = Record<string, string>;
