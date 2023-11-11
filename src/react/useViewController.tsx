import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { declareModule, Token } from 'ditox';
import { DependencyModule, useDependencyContainer } from 'ditox-react';

import { atom, WritableAtom } from '../core/atom';
import { AnyObject, Atom } from '../core/common';
import { Controller, ControllerFactory } from '../mvc/controller';
import { ViewControllerFactory } from '../mvc/declareViewController';

export function useViewController<
  Result extends Record<string, unknown>,
  Params extends unknown[],
  QueryParams extends {
    [K in keyof Params]: Params[K] extends infer V ? Atom<V> : never;
  },
>(
  factory: ViewControllerFactory<Result, QueryParams>,
  ...params: Params
): Controller<Result> {
  const container = useDependencyContainer('strict');
  const storesRef = useRef<WritableAtom<any>[]>();

  const controller = useMemo(() => {
    if (!storesRef.current) {
      storesRef.current = createStoresForParams(params);
    }

    return factory(container, ...(storesRef.current as unknown as QueryParams));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, factory]);

  useEffect(() => {
    const stores = storesRef.current;
    if (stores) {
      params.forEach((value, index) => stores[index].set(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, params);

  useEffect(() => () => controller.destroy(), [controller]);

  return controller;
}

function createStoresForParams(params: any[]): WritableAtom<any>[] {
  return params.length === 0
    ? []
    : new Array(params.length)
        .fill(undefined)
        .map((_, index) => atom(params[index]));
}

export function createControllerContainer<T extends AnyObject>(
  token: Token<T>,
  factory: ControllerFactory<T>,
): FC<PropsWithChildren> {
  const module = declareModule({ factory, token });

  return ({ children }) => (
    <DependencyModule module={module}>{children}</DependencyModule>
  );
}
