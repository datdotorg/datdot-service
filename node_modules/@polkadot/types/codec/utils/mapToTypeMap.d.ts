import { Codec, Constructor, InterfaceTypes, Registry } from '../../types';
export declare function typeToConstructor<T = Codec>(registry: Registry, type: InterfaceTypes | Constructor<T>): Constructor<T>;
/**
 * @description takes an input map of the form `{ [string]: string | Constructor }` and returns a map of `{ [string]: Constructor }`
 */
export declare function mapToTypeMap(registry: Registry, input: Record<string, InterfaceTypes | Constructor>): Record<string, Constructor>;
