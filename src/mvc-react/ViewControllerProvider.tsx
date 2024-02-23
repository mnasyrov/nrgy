import React, { createContext, FC, PropsWithChildren, useContext } from 'react';

import { BaseService, Controller, ControllerDeclaration } from '../mvc';

const REACT_CONTEXTS = new Map<
  ControllerDeclaration<any, any>,
  React.Context<any>
>();

const EMPTY_CONTEXT = createContext(undefined);

export function useProvidedViewController<TService extends BaseService>(
  declaration: ControllerDeclaration<any, TService>,
): TService {
  const reactContext = REACT_CONTEXTS.get(declaration) ?? EMPTY_CONTEXT;

  const value = useContext(reactContext);

  if (value === undefined) {
    throw new Error('Controller is not provided');
  }

  return value;
}

export function useOptionalViewController<
  TService extends BaseService | undefined,
>(
  declaration: ControllerDeclaration<any, Exclude<TService, undefined>>,
  defaultValue: TService,
): TService {
  const reactContext = REACT_CONTEXTS.get(declaration) ?? EMPTY_CONTEXT;

  return useContext(reactContext) ?? defaultValue;
}

export const ViewControllerProvider: FC<
  PropsWithChildren<{
    declaration: ControllerDeclaration<any, any>;
    controller: Controller<any>;
  }>
> = ({ children, declaration, controller }) => {
  let ViewProviderContext = REACT_CONTEXTS.get(declaration);
  if (!ViewProviderContext) {
    ViewProviderContext = createContext<any>(undefined);
    REACT_CONTEXTS.set(declaration, ViewProviderContext);
  }

  return (
    <ViewProviderContext.Provider value={controller}>
      {children}
    </ViewProviderContext.Provider>
  );
};
