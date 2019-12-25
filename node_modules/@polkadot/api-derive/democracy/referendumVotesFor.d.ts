import BN from 'bn.js';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { DerivedReferendumVote } from '../types';
export declare function referendumVotesFor(api: ApiInterfaceRx): (referendumId: BN | number) => Observable<DerivedReferendumVote[]>;
