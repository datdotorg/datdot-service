import { AccountId, Balance, BlockNumber } from '@polkadot/types/interfaces';
import { ITuple } from '@polkadot/types/types';
import { DeriveProposal } from '../types';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { Bytes, Option } from '@polkadot/types';
export declare type PreImage = Option<ITuple<[Bytes, AccountId, Balance, BlockNumber]>>;
export declare function proposals(api: ApiInterfaceRx): () => Observable<DeriveProposal[]>;
