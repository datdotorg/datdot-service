import { ApiInterfaceRx } from '@polkadot/api/types';
import { AccountId } from '@polkadot/types/interfaces';
import { Observable } from 'rxjs';
import { Option } from '@polkadot/types';
declare type DeriveControllers = [AccountId[], Option<AccountId>[]];
/**
 * @description From the list of stash accounts, retrieve the list of controllers
 */
export declare function controllers(api: ApiInterfaceRx): () => Observable<DeriveControllers>;
export {};
