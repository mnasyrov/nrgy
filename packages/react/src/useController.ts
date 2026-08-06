import {
  type BaseControllerContext,
  type BaseService,
  type Controller,
  type ControllerDeclaration,
  createViewProxy,
  type ExtensionParams,
  type InferViewPropsFromControllerContext,
  provideExtensionParams,
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

  // The providers may call React hooks, so they are invoked on every
  // render to keep execution of React hooks in order.
  const extensionParams: ExtensionParams = reactExtensionProviders.reduce(
    (params, provider) => provider(params),
    {},
  );

  const extensionParamsRef = useRef<ExtensionParams>(extensionParams);
  extensionParamsRef.current = extensionParams;

  const hookContextRef = useRef<HookContext>(undefined);
  const [, forceUpdate] = useReducer((value: number) => value + 1, 0);

  const createHookContext = (): HookContext => {
    const view = createViewProxy<TProps>((props ?? {}) as TProps);

    // The declaration takes the extension params captured on the last
    // render, so no React hooks are invoked here. It makes this function
    // safe to be called outside of rendering, from the mount effect.
    const providers = [
      provideExtensionParams(extensionParamsRef.current),
      provideView(view),
    ];
    const controller = new declaration(providers);

    return {
      declaration,
      controller,
      view,
    };
  };

  if (hookContextRef.current?.declaration !== declaration) {
    hookContextRef.current = createHookContext();
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
