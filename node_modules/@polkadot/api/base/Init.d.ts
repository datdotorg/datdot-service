import { ApiOptions, ApiTypes, DecorateMethod } from '../types';
import Decorate from './Decorate';
export default abstract class Init<ApiType extends ApiTypes> extends Decorate<ApiType> {
    #private;
    constructor(options: ApiOptions, type: ApiTypes, decorateMethod: DecorateMethod<ApiType>);
    protected loadMeta(): Promise<boolean>;
    private metaFromSource;
    private subscribeUpdates;
    private metaFromChain;
    private initFromMeta;
}
