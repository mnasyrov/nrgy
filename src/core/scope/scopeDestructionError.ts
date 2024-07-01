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
