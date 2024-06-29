import { createAtomFromFunction, generateAtomId } from './atom';
import { Atom, AtomEffectNode, ComputedNode, ValueEqualityFn } from './common';
import { defaultEquals } from './commonUtils';
import { ENERGY_RUNTIME } from './runtime';
import { nextSafeInteger } from './utils/nextSafeInteger';

/**
 * A pure function that returns a value.
 */
export type Computation<T> = () => T;

/**
 * Options for `compute`
 */
export type ComputeOptions<T> = {
  /**
   * Atom's name
   */
  name?: string;

  /**
   * A function to determine if two values are equal. Defaults to `Object.is`.
   */
  equal?: ValueEqualityFn<T>;
};

/**
 * Create a computed `Atom` which derives a reactive value from an expression.
 *
 * @param computation A pure function that returns a value
 * @param options ComputeOptions
 */
export function compute<T>(
  computation: Computation<T>,
  options?: ComputeOptions<T>,
): Atom<T> {
  const node = new ComputedImpl(computation, options);

  return createAtomFromFunction(node, node.get.bind(node));
}

/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const UNSET: any = Symbol('UNSET');

/**
 * A dedicated symbol used in place of a computed atom value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const COMPUTING: any = Symbol('COMPUTING');

/**
 * A dedicated symbol used in place of a computed atom value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const ERRORED: any = Symbol('ERRORED');

/**
 * A computation, which derives a value from a declarative reactive expression.
 */
export class ComputedImpl<T> implements ComputedNode<T> {
  readonly id: number = generateAtomId();
  readonly name?: string;

  clock: number | undefined = undefined;
  version = 0;

  /**
   * Current value of the computation.
   *
   * This can also be one of the special values `UNSET`, `COMPUTING`, or `ERRORED`.
   */
  private value: T = UNSET;
  private readonly equal: ValueEqualityFn<T>;

  /**
   * If `value` is `ERRORED`, the error caught from the last computation attempt which will
   * be re-thrown.
   */
  private error: unknown = undefined;

  private lastEffectRef: WeakRef<AtomEffectNode> | undefined;

  constructor(
    private computation: Computation<T>,
    options?: ComputeOptions<T>,
  ) {
    this.name = options?.name;
    this.equal = options?.equal ?? defaultEquals;
  }

  destroy(): void {
    this.value = UNSET;
    this.lastEffectRef = undefined;
  }

  get(): T {
    this.accessValue();

    if (this.value === ERRORED) {
      throw this.error;
    }

    return this.value;
  }

  private accessValue(): void {
    if (this.value === COMPUTING) {
      // Our computation somehow led to a cyclic read of itself.
      throw new Error('Detected cycle in computations');
    }

    const activeEffect = ENERGY_RUNTIME.getCurrentEffect();

    const isStale =
      this.clock !== ENERGY_RUNTIME.clock ||
      this.value === UNSET ||
      (activeEffect && this.lastEffectRef !== activeEffect.ref);

    if (isStale) {
      this.lastEffectRef = activeEffect?.ref;
      this.recomputeValue();
    }
  }

  private recomputeValue(): void {
    const oldValue = this.value;
    this.value = COMPUTING;

    let newValue: T;

    try {
      newValue = this.computation();
    } catch (err) {
      newValue = ERRORED;
      this.error = err;
    }

    // As we're re-running the computation, update our dependent tracking version number.
    this.clock = ENERGY_RUNTIME.clock;

    if (
      oldValue === UNSET ||
      oldValue === ERRORED ||
      newValue === ERRORED ||
      !this.equal(oldValue, newValue)
    ) {
      this.value = newValue;
      this.version = nextSafeInteger(this.version);
    } else {
      // No change to `valueVersion` - old and new values are
      // semantically equivalent.
      this.value = oldValue;
    }
  }
}
