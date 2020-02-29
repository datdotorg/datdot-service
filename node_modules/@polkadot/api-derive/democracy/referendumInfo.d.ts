import { ReferendumInfo } from '@polkadot/types/interfaces/democracy';
import { DerivedReferendum } from '../types';
import BN from 'bn.js';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { Option } from '@polkadot/types';
export declare function retrieveInfo(api: ApiInterfaceRx, index: BN | number, info: Option<ReferendumInfo>): Observable<DerivedReferendum | null>;
export declare function referendumInfo(api: ApiInterfaceRx): (index: BN | number) => Observable<DerivedReferendum | null>;
