import { useEffect, useRef } from 'react';

import {
  BaseControllerContext,
  BaseService,
  Controller,
  ControllerDeclaration,
  createViewProxy,
  InferViewPropsFromControllerContext,
  provideView,
  ViewProxy,
} from '../mvc';

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

  const hookContextRef = useRef<HookContext>();

  if (hookContextRef.current?.declaration !== declaration) {
    const view = createViewProxy<TProps>((props ?? {}) as TProps);

    // NOTE:  React hooks of the extension will be invoked
    //        by calling the declaration.
    const providers = [...reactExtensionProviders, provideView(view)];
    const controller = new declaration(providers);

    hookContextRef.current = {
      declaration,
      controller,
      view,
    };
  } else {
    // HACK:  Needs to keep invoking the extension providers
    //        to keep execution of React hooks in the order.
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
    const context = hookContextRef.current;
    if (context) {
      context.view.mount();
    }

    return () => {
      if (context) {
        context.view.destroy();
        context.controller.destroy();
      }

      if (hookContextRef.current === context) {
        hookContextRef.current = undefined;
      }
    };
  }, [declaration]);

  return hookContextRef.current!.controller;
}
