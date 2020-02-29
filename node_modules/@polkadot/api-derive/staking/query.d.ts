import { ApiInterfaceRx } from '@polkadot/api/types';
import { DerivedStakingQuery } from '../types';
import { Observable } from 'rxjs';
/**
 * @description From a stash, retrieve the controllerId and all relevant details
 */
export declare function query(api: ApiInterfaceRx): (accountId: Uint8Array | string) => Observable<DerivedStakingQuery>;
