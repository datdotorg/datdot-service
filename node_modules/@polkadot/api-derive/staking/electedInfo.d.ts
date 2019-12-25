import { ApiInterfaceRx } from '@polkadot/api/types';
import { DerivedStakingElected } from '../types';
import { Observable } from 'rxjs';
export declare function electedInfo(api: ApiInterfaceRx): () => Observable<DerivedStakingElected>;
