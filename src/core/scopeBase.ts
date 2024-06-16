import {
  Destroyable,
  ScopeDestructionError,
  ScopeTeardown,
  Unsubscribable,
} from './scopeTypes';
import { ListItem } from './utils/list';

type TeardownList = ListItem<{ teardown: ScopeTeardown }>;

/**
 * @internal
 */
export class BaseScope {
  private subscriptions: undefined | TeardownList;

  onDestroy(teardown: ScopeTeardown): void {
    this.subscriptions = { teardown, next: this.subscriptions };
  }

  add<T extends Unsubscribable | Destroyable>(resource: T): T {
    this.subscriptions = { teardown: resource, next: this.subscriptions };
    return resource;
  }

  destroy(): void {
    if (!this.subscriptions) {
      return;
    }

    let errors: unknown[] | undefined;
    let item: undefined | TeardownList = this.subscriptions;
    this.subscriptions = undefined;

    while (item) {
      const { teardown } = item;

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

      item = item.next;
    }

    if (errors) {
      throw new ScopeDestructionError(errors);
    }
  }
}
