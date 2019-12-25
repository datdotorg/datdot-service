import { ApiInterfaceRx } from '@polkadot/api/types';
import { DeriveStakingValidators } from '../types';
import { Observable } from 'rxjs';
/**
 * @description Retrieve latest list of validators
 */
export declare function validators(api: ApiInterfaceRx): () => Observable<DeriveStakingValidators>;
