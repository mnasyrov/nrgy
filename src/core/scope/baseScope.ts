import { ListItem } from '../utils/list';

import { ScopeDestructionError } from './scopeDestructionError';
import { Destroyable, ScopeTeardown, Unsubscribable } from './types';

type TeardownList = ListItem<{ teardown: ScopeTeardown }>;

/**
 * @internal
 */
export class BaseScope implements Destroyable {
  private subscriptions: undefined | TeardownList;

  /**
   * Registers a callback or unsubscribable resource which will be called when `destroy()` is called
   */
  onDestroy(teardown: ScopeTeardown): void {
    this.subscriptions = { teardown, next: this.subscriptions };
  }

  /**
   * Registers an unsubscribable resource which will be called when `destroy()` is called
   */
  add<T extends Unsubscribable | Destroyable>(resource: T): T {
    this.subscriptions = { teardown: resource, next: this.subscriptions };
    return resource;
  }

  /**
   * Destroys the scope
   */
  destroy(): void {
    if (!this.subscriptions) {
      return;
    }

    let errors: unknown[] | undefined;
    let list: undefined | TeardownList = this.subscriptions;
    this.subscriptions = undefined;

    while (list) {
      const { teardown } = list;

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

      list = list.next;
    }

    if (errors) {
      throw new ScopeDestructionError(errors);
    }
  }
}
