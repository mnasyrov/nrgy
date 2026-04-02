import {
  type BaseControllerContext,
  type BaseService,
  type Controller,
  type ControllerDeclaration,
  createViewProxy,
  type InferViewPropsFromControllerContext,
  provideView,
  type ViewProxy,
} from '@nrgyjs/core';
import { useEffect, useReducer, useRef } from 'react';

import { useNrgyControllerExtensionContext } from './NrgyControllerExtension';

/**
 * Returns a controller instance for the given controller declaration.
 */
export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): TService;

/**
 * Returns a controller instance for the given controller declaration and props.
 */
export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TProps extends InferViewPropsFromControllerContext<TContext, never>,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  props: TProps,
): TService;

/**
 * Returns a controller instance for the given controller declaration and props.
 */
export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TProps extends InferViewPropsFromControllerContext<
    TContext,
    Record<string, never>
  >,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  props?: TProps,
): TService {
  type HookContext = {
    declaration: ControllerDeclaration<TContext, TService>;
    controller: Controller<TService>;
    view: ViewProxy<TProps>;
  };

  const reactExtensionProviders = useNrgyControllerExtensionContext();

  const hookContextRef = useRef<HookContext>(undefined);
  const [, forceUpdate] = useReducer((value: number) => value + 1, 0);

  const createHookContext = (): HookContext => {
    const view = createViewProxy<TProps>((props ?? {}) as TProps);

    // NOTE: React hooks of the extension will be invoked
    //        by calling the declaration.
    const providers = [...reactExtensionProviders, provideView(view)];
    const controller = new declaration(providers);

    return {
      declaration,
      controller,
      view,
    };
  };

  if (hookContextRef.current?.declaration !== declaration) {
    hookContextRef.current = createHookContext();
  } else {
    // HACK: Needs to keep invoking the extension providers
    //        to keep execution of React hooks in order.
    for (const provider of reactExtensionProviders) {
      provider({});
    }
  }

  useEffect(() => {
    const context = hookContextRef.current;
    if (context) {
      context.view.update(props);
    }
  }, [props]);

  useEffect(() => {
    let context = hookContextRef.current;

    if (!context) {
      context = createHookContext();
      hookContextRef.current = context;
      forceUpdate();
    }

    context.view.mount();

    return () => {
      context.view.destroy();
      context.controller.destroy();

      if (hookContextRef.current === context) {
        hookContextRef.current = undefined;
      }
    };
  }, [declaration]);

  return hookContextRef.current!.controller;
}
