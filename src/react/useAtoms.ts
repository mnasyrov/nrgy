import { useRef } from 'react';

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
  const sourcesRef = useRef(sourcesArg);
  sourcesRef.current = sourcesArg;

  const $result = useRef(() =>
    compute(
      () => {
        const sourceAtoms = sourcesRef.current;

        if (sourceAtoms === EMPTY_ATOMS_SOURCES) {
          return EMPTY_ATOMS_RESULTS as TResult;
        }

        const acc: Record<string, any> = {};

        for (const key of Object.keys(sourceAtoms)) {
          acc[key] = sourceAtoms[key]();
        }

        return acc as TResult;
      },
      { equal: objectEquals },
    ),
  );

  return useAtom($result.current());
};
