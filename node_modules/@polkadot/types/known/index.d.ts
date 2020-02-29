import { RuntimeVersion } from '../interfaces';
import { RegistryTypes } from '../types';
import { OverrideModuleType } from './types';
import { Text } from '@polkadot/types';
/** @internal */
export declare function getMetadataTypes(version: number): RegistryTypes;
/** @internal */
export declare function getSpecTypes(chainName: Text | string, { specName, specVersion }: RuntimeVersion): RegistryTypes;
/** @internal */
export declare function getUserTypes(chainName: Text | string, { specName }: RuntimeVersion, typesChain?: Record<string, RegistryTypes>, typesSpec?: Record<string, RegistryTypes>): RegistryTypes;
/** @internal */
export declare function getModuleTypes(section: string): OverrideModuleType;
