import { useEffect, useState } from 'react';

import { Atom, effect } from '../core';

/**
 * Returns a value which is provided by the atom.
 *
 * @param source – a provider of a value
 */
export function useAtom<T>(source: Atom<T>): T {
  const [value, setValue] = useState<T>(source);

  useEffect(() => {
    const subscription = effect(() => setValue(source()));

    return subscription.destroy;
  }, [source]);

  return value;
}
