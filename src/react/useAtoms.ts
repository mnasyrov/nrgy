import { useMemo } from 'react';

import { Atom, compute, objectEquals } from '../core';

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

export const useAtoms: UseAtomsFn = function <
  TSourceAtoms extends Record<string, Atom<unknown>>,
  TResult extends {
    [K in keyof TSourceAtoms]: TSourceAtoms[K] extends Atom<infer V>
      ? V
      : never;
  },
>(sources: TSourceAtoms): TResult {
  const sourcesArg = sources ?? EMPTY_ATOMS_SOURCES;

  const $result = useMemo(() => createComputedAtoms(sourcesArg), [sourcesArg]);

  return useAtom($result) as TResult;
};

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
