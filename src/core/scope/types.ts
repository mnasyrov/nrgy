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
