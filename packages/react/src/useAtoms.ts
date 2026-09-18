import { type Atom, compute, objectEquals } from '@nrgyjs/core';
import { useMemo, useRef } from 'react';

import { useAtom } from './useAtom';

const EMPTY_ATOMS_SOURCES = {};
const EMPTY_ATOMS_RESULTS = {};

export type UseAtomsFn = {
  (sources?: undefined): Record<string, never>;

  <
    TSourceAtoms extends Record<string, Atom<unknown>>,
    TResult extends {
      [K in keyof TSourceAtoms]: TSourceAtoms[K] extends Atom<infer V>
        ? V
        : never;
    },
  >(
    sources: TSourceAtoms,
  ): TResult;
};

/**
 * Returns values which are provided by the atoms.
 *
 * The record of sources may be created inline on every render: the hook keeps
 * the previous record while its keys and atoms are the same, so the derived
 * value stays referentially stable and the subscription is not recreated.
 *
 * @param sources – a record of atoms
 */
export const useAtoms: UseAtomsFn = function <
  TSourceAtoms extends Record<string, Atom<unknown>>,
  TResult extends {
    [K in keyof TSourceAtoms]: TSourceAtoms[K] extends Atom<infer V>
      ? V
      : never;
  },
>(sources: TSourceAtoms): TResult {
  const stableSources = useStableSources(sources ?? EMPTY_ATOMS_SOURCES);

  const $result = useMemo(
    () => createComputedAtoms(stableSources),
    [stableSources],
  );

  return useAtom($result) as TResult;
};

/**
 * Returns the previous record of sources while the next one has the same keys
 * and the same atoms.
 */
function useStableSources<TSourceAtoms extends Record<string, Atom<unknown>>>(
  sources: TSourceAtoms,
): TSourceAtoms {
  const ref = useRef(sources);

  if (ref.current !== sources && !objectEquals(ref.current, sources)) {
    ref.current = sources;
  }

  return ref.current;
}

function createComputedAtoms<
  TSourceAtoms extends Record<string, Atom<unknown>>,
  TResult extends {
    [K in keyof TSourceAtoms]: TSourceAtoms[K] extends Atom<infer V>
      ? V
      : never;
  },
>(sources: TSourceAtoms): Atom<TResult> {
  if (sources === EMPTY_ATOMS_SOURCES) {
    return compute(() => EMPTY_ATOMS_RESULTS as TResult);
  }

  return compute(
    () => {
      const sourceAtoms = sources;

      const result: Record<string, any> = {};

      for (const key of Object.keys(sourceAtoms)) {
        result[key] = sourceAtoms[key]();
      }

      return result as TResult;
    },
    { equal: objectEquals },
  );
}
