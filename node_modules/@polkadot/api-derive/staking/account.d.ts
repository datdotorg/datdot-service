import { ApiInterfaceRx } from '@polkadot/api/types';
import { DerivedStakingAccount } from '../types';
import { Observable } from 'rxjs';
/**
 * @description From a stash, retrieve the controllerId and fill in all the relevant staking details
 */
export declare function account(api: ApiInterfaceRx): (accountId: Uint8Array | string) => Observable<DerivedStakingAccount>;
