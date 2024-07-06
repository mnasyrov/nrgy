import { AtomOptions, WritableAtom } from './atom';

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export interface AtomFn {
  <T>(initialValue: T, options?: AtomOptions<T>): WritableAtom<T>;
}
