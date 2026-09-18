import { type Atom, syncEffect } from '@nrgyjs/core';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Returns a value which is provided by the atom.
 *
 * The hook is built on `useSyncExternalStore`: the value is read from the atom
 * on every render, so a change of the `source` atom itself is visible in the
 * same commit. Updates of the atom are delivered synchronously: an update
 * inside an event handler or inside `act()` is rendered without waiting
 * for a microtask.
 *
 * The `source` atom must be stable between renders. Do not create an atom
 * in the render body without memoization, otherwise the hook resubscribes
 * on every render.
 *
 * @param source – a provider of a value
 */
export function useAtom<T>(source: Atom<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => syncEffect(source, onStoreChange).destroy,
    [source],
  );

  return useSyncExternalStore(subscribe, source, source);
}
