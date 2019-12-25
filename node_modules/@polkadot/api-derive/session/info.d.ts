import { DerivedSessionInfo } from '../types';
import { Observable } from 'rxjs';
import { ApiInterfaceRx } from '@polkadot/api/types';
/**
 * @description Retrieves all the session and era info and calculates specific values on it as the length of the session and eras
 */
export declare function info(api: ApiInterfaceRx): () => Observable<DerivedSessionInfo>;
