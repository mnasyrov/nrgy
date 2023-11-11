import { useEffect, useState } from 'react';

import { Atom, effect } from '../core/_public';

/**
 * Returns a value which is provided by the atom.
 *
 * @param store – a provider of a value
 */
export function useAtom<T>(store: Atom<T>): T {
  const [value, setValue] = useState<T>(store);

  useEffect(() => {
    const subscription = effect(() => setValue(store()));

    return subscription.destroy;
  }, [store]);

  return value;
}
