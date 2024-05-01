/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribable {
  unsubscribe(): void;
}

/**
 * An object which can be destroyed
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * A resource which can be unsubscribed from or destroyed
 */
export type ScopeTeardown = Unsubscribable | Destroyable | (() => unknown);

/**
 * An error thrown when one or more errors have occurred during the
 * `destroy` of a {@link Scope}.
 */
export class ScopeDestructionError extends Error {
  readonly errors: unknown[];

  constructor(errors: unknown[]) {
    super();
    this.name = 'ScopeDestructionError';
    this.errors = errors;
  }
}
