import { Constructor, Registry } from '../types';
import Null from './Null';
/**
 * @name Unconstructable
 * @description
 * An unknown type theat fails on constrction with the type info
 */
export default class Unconstructable extends Null {
    constructor(registry: Registry, typeName: string);
    static with(typeName: string): Constructor;
}
