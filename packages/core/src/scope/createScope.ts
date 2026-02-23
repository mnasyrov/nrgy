import type { AnyFunction } from '../common/types';
import { atom, effect, syncEffect } from '../reactivity/reactivity';
import { ScopeDestructionError } from './scopeDestructionError.ts';
import type {
  Destroyable,
  Scope,
  ScopeTeardown,
  Unsubscribable,
} from './types';

type TeardownList = { teardown: ScopeTeardown; next?: TeardownList };

type ScopeNode = { subscriptions?: TeardownList };

/**
 * Creates `Scope` instance.
 */
export function createScope(): Scope {
  const node: ScopeNode = {};

  return {
    onDestroy: (teardown) => onScopeDestroy(node, teardown),
    add: (resource) => addToScope(node, resource),
    destroy: () => destroyScope(node),

    createScope: () => addToScope(node, createScope()),

    atom: (...args: any[]) => addToScope(node, (atom as AnyFunction)(...args)),
    effect: (...args: any[]) =>
      addToScope(node, (effect as AnyFunction)(...args)),
    syncEffect: (...args: any[]) =>
      addToScope(node, (syncEffect as AnyFunction)(...args)),
  };
}

/**
 * Registers a callback or unsubscribable resource which will be called when `destroy()` is called
 */
function onScopeDestroy(node: ScopeNode, teardown: ScopeTeardown): void {
  node.subscriptions = { teardown, next: node.subscriptions };
}

/**
 * Registers an unsubscribable resource which will be called when `destroy()` is called
 */
function addToScope<T extends Unsubscribable | Destroyable>(
  node: ScopeNode,
  resource: T,
): T {
  node.subscriptions = { teardown: resource, next: node.subscriptions };
  return resource;
}

/**
 * Destroys the scope
 */
function destroyScope(node: ScopeNode): void {
  if (!node.subscriptions) {
    return;
  }

  let errors: unknown[] | undefined;
  let list: undefined | TeardownList = node.subscriptions;
  node.subscriptions = undefined;

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
