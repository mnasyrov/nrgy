import {
  Destroyable,
  ScopeDestructionError,
  ScopeTeardown,
  Unsubscribable,
} from './scopeTypes';

/**
 * @internal
 */
export class BaseScope {
  private subscriptions: ScopeTeardown[] = [];

  onDestroy(teardown: ScopeTeardown): void {
    this.subscriptions.push(teardown);
  }

  add<T extends Unsubscribable | Destroyable>(resource: T): T {
    this.subscriptions.push(resource);
    return resource;
  }

  destroy(): void {
    if (this.subscriptions.length === 0) {
      return;
    }

    const teardowns = this.subscriptions;
    this.subscriptions = [];

    let errors: unknown[] | undefined;

    for (const teardown of teardowns) {
      try {
        if ('unsubscribe' in teardown) {
          teardown.unsubscribe();
        } else if ('destroy' in teardown) {
          teardown.destroy();
        } else {
          teardown();
        }
      } catch (error) {
        if (!errors) {
          errors = [];
        }
        errors.push(error);
      }
    }

    if (errors) {
      throw new ScopeDestructionError(errors);
    }
  }
}
