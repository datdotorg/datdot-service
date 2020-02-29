import { OverrideModuleType, OverrideVersionedType } from './types';
declare const TYPES_MODULES: Record<string, OverrideModuleType>;
declare const TYPES_CHAIN: Record<string, OverrideVersionedType[]>;
declare const TYPES_META: OverrideVersionedType[];
declare const TYPES_SPEC: Record<string, OverrideVersionedType[]>;
export { TYPES_CHAIN, TYPES_META, TYPES_MODULES, TYPES_SPEC };
