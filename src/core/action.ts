import { AtomOptions } from './atom';
import { ActionEffectNode, ActionNode } from './common';

const ACTION_SYMBOL = Symbol.for('ngry.action');

/**
 * Action is an event emitter
 *
 * @param operator Optional transformation or handler for an event
 *
 * @field event$ - Observable for emitted events.
 *
 * @example
 * ```ts
 * // Create the action
 * const submitForm = createAction<{login: string, password: string}>();
 *
 * // Call the action
 * submitForm({login: 'foo', password: 'bar'});
 *
 * // Handle action's events
 * effect(submitForm, (formData) => {
 *   // Process the formData
 * });
 * ```
 */
export type Action<Event> = {
  (event: Event): void;
  readonly [ACTION_SYMBOL]: unknown;
} & ([Event] extends [undefined | void]
  ? { (event?: Event): void }
  : { (event: Event): void });

/**
 * Options passed to the `action` creation function.
 */
export type ActionOptions = {
  /**
   * Action's name
   */
  name?: string;

  /**
   * Callback is called when the action is destroyed.
   */
  onDestroy?: () => void;
};

/**
 * Checks if the given `value` is a reactive `Action`.
 */
export function isAction<T>(value: unknown): value is Action<T> {
  return typeof value === 'function' && ACTION_SYMBOL in value;
}

export function getActionNode<T>(value: Action<T>): ActionNode<T> {
  return value[ACTION_SYMBOL] as ActionNode<T>;
}

export function destroyAction(action: Action<any>): void {
  getActionNode(action).destroy();
}

export function isActionObserved(action: Action<any>): boolean {
  return getActionNode(action).isObserved();
}

class ActionImpl<T> implements ActionNode<T> {
  private readonly name?: string;
  private onDestroy?: () => void;
  private readonly consumerEffects = new Set<WeakRef<ActionEffectNode<T>>>();

  isDestroyed = false;

  constructor(options?: AtomOptions<T>) {
    this.name = options?.name;
    this.onDestroy = options?.onDestroy;
  }

  /**
   * Emits a value
   */
  emit(value: T): void {
    if (this.isDestroyed) {
      return;
    }

    this.producerChanged(value);
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.consumerEffects.clear();
    this.isDestroyed = true;
    this.onDestroy?.();
    this.onDestroy = undefined;
  }

  subscribe(effectRef: WeakRef<ActionEffectNode<T>>): void {
    this.consumerEffects.add(effectRef);
  }

  isObserved(): boolean {
    return this.consumerEffects.size > 0;
  }

  /**
   * Notify all consumers of this producer that its value is changed.
   */
  protected producerChanged(value: T): void {
    for (const effectRef of this.consumerEffects) {
      const effect = effectRef.deref();

      if (!effect || effect.isDestroyed) {
        this.consumerEffects.delete(effectRef);
        continue;
      }

      effect.notify(value);
    }
  }
}

export function action<T = void>(options?: ActionOptions): Action<T> {
  const node = new ActionImpl<T>(options);

  const action = (value: T) => node.emit(value);
  (action as any)[ACTION_SYMBOL] = node;

  return action as Action<T>;
}
