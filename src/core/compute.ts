import { createAtomFromFunction } from './atom';
import { defaultEquals } from './atomUtils';
import { Atom, AtomEffectNode, ComputedNode, ValueEqualityFn } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { nextSafeInteger } from './utils/nextSafeInteger';

export type Computation<T> = () => T;

export type ComputeOptions<T> = {
  equal?: ValueEqualityFn<T>;
};

/**
 * Create a computed `Atom` which derives a reactive value from an expression.
 */
export function compute<T>(
  computation: Computation<T>,
  options?: ComputeOptions<T>,
): Atom<T> {
  const node = new ComputedImpl(computation, options?.equal ?? defaultEquals);

  return createAtomFromFunction(node, node.get.bind(node), {
    destroy: node.destroy.bind(node),
  });
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
 *
 * `Computed`s are both producers and consumers of reactivity.
 */
export class ComputedImpl<T> implements ComputedNode<T> {
  clock: number | undefined = undefined;
  version = 0;

  /**
   * Current value of the computation.
   *
   * This can also be one of the special values `UNSET`, `COMPUTING`, or `ERRORED`.
   */
  private value: T = UNSET;
  private changed = false;

  /**
   * If `value` is `ERRORED`, the error caught from the last computation attempt which will
   * be re-thrown.
   */
  private error: unknown = undefined;

  private lastEffectRef: WeakRef<AtomEffectNode> | undefined;

  constructor(
    private computation: Computation<T>,
    private equal: (oldValue: T, newValue: T) => boolean,
  ) {}

  destroy(): void {
    this.value = UNSET;
    this.lastEffectRef = undefined;
  }

  isChanged(): boolean {
    if (
      this.clock === ENERGY_RUNTIME.clock &&
      this.value !== UNSET &&
      this.value !== COMPUTING
    ) {
      return this.changed;
    }

    const prevVersion = this.version;
    this.accessValue(false);

    return this.version !== prevVersion;
  }

  get(): T {
    this.accessValue(true);

    if (this.value === ERRORED) {
      throw this.error;
    }

    return this.value;
  }

  private accessValue(trackNode: boolean): void {
    if (this.value === COMPUTING) {
      // Our computation somehow led to a cyclic read of itself.
      throw new Error('Detected cycle in computations');
    }

    if (trackNode) {
      ENERGY_RUNTIME.visitComputedNode(this);
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

    // As we're re-running the computation, update our dependent tracking version number.
    let newValue: T;
    try {
      newValue = this.computation();
    } catch (err) {
      newValue = ERRORED;
      this.error = err;
    }

    this.clock = ENERGY_RUNTIME.clock;

    if (
      oldValue === UNSET ||
      oldValue === ERRORED ||
      newValue === ERRORED ||
      !this.equal(oldValue, newValue)
    ) {
      this.value = newValue;
      this.version = nextSafeInteger(this.version);
      this.changed = true;
    } else {
      // No change to `valueVersion` - old and new values are
      // semantically equivalent.
      this.value = oldValue;
      this.changed = false;
    }
  }
}
