/**
 * @internal
 */
export type Listener<T> = (value: T) => void;

/**
 * @internal
 */
export type EmitterSubscription = { destroy: () => void };

/**
 * @internal
 */

export class Emitter<T> {
  private readonly listeners: Set<Listener<T>> = new Set();

  subscribe(listener: Listener<T>): EmitterSubscription {
    this.listeners.add(listener);

    return {
      destroy: () => this.listeners.delete(listener),
    };
  }

  emit(value: T) {
    this.listeners.forEach((listener) => listener(value));
  }

  destroy() {
    this.listeners.clear();
  }
}
