import { DerivedReferendum } from '../types';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
export declare function referendumInfos(api: ApiInterfaceRx): (ids?: (BN | number)[]) => Observable<DerivedReferendum[]>;
