import { type Atom, effect } from '@nrgyjs/core';
import { useEffect, useState } from 'react';

/**
 * Returns a value which is provided by the atom.
 *
 * @param source – a provider of a value
 */
export function useAtom<T>(source: Atom<T>): T {
  const [value, setValue] = useState<T>(source);

  useEffect(() => {
    const subscription = effect(source, (value) => setValue(value));

    return subscription.destroy;
  }, [source]);

  return value;
}
