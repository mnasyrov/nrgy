import React, { createContext, PropsWithChildren, useContext } from 'react';

import { createWeakMap } from '../core/utils/createWeakMap';
import {
  BaseControllerContext,
  BaseService,
  ControllerDeclaration,
} from '../mvc';

const EMPTY_VALUE = Symbol('nrgy.EMPTY_VALUE');
const EMPTY_CONTEXT = createContext(EMPTY_VALUE);

const REACT_CONTEXTS = createWeakMap<
  ControllerDeclaration<any, any>,
  React.Context<any>
>();

/**
 * Returns parent's view controller that is provided for the given controller declaration.
 *
 * If the controller is not provided in the context, an error will be thrown.
 */
export function useProvidedViewController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): TService {
  const reactContext = REACT_CONTEXTS.get(declaration as any) ?? EMPTY_CONTEXT;

  const value = useContext(reactContext);

  if (value === EMPTY_VALUE) {
    throw new Error('Controller is not provided');
  }

  return value;
}

/**
 * Returns parent's view controller that is provided for the given controller declaration.
 *
 * Optional view controller can be used when the controller is not provided in the context.
 */
export function useOptionalViewController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): TService | undefined;

/**
 * Returns parent's view controller that is provided for the given controller declaration.
 *
 * Optional view controller can be used when the controller is not provided in the context.
 */
export function useOptionalViewController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TDefault extends TService | undefined,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  defaultValue: TDefault,
): TService | TDefault;

/**
 * Returns parent's view controller that is provided for the given controller declaration.
 *
 * Optional view controller can be used when the controller is not provided in the context.
 */
export function useOptionalViewController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TDefault extends TService | undefined = undefined,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  defaultValue?: TDefault,
): TService | TDefault {
  const reactContext = REACT_CONTEXTS.get(declaration) ?? EMPTY_CONTEXT;

  const value = useContext(reactContext);

  return value === EMPTY_VALUE ? defaultValue : value;
}

/**
 * @internal
 *
 * Creates a React context that provides a controller for a given controller declaration.
 */
export const ViewControllerProvider = <
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  props: PropsWithChildren<{
    declaration: ControllerDeclaration<TContext, TService>;
    controller: TService;
  }>,
) => {
  const { children, declaration, controller } = props;

  let ViewProviderContext = REACT_CONTEXTS.get(declaration);
  if (!ViewProviderContext) {
    ViewProviderContext = createContext<any>(EMPTY_VALUE);
    REACT_CONTEXTS.set(declaration, ViewProviderContext);
  }

  return (
    <ViewProviderContext.Provider value={controller}>
      {children}
    </ViewProviderContext.Provider>
  );
};
