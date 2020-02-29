import { DerivedReferendum } from '../types';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
export declare function referendums(api: ApiInterfaceRx): () => Observable<DerivedReferendum[]>;
