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
  TProps extends InferViewPropsFromControllerContext<TContext, undefined>,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  props?: TProps,
): TService {
  type ViewProxyProps = TProps extends undefined
    ? Record<string, never>
    : TProps;

  type HookContext = {
    declaration: ControllerDeclaration<TContext, TService>;
    controller: Controller<TService>;
    view: ViewProxy<ViewProxyProps>;
    isMounted: boolean;
  };

  const extensionParamsProviders = useNrgyControllerExtensionContext();

  const hookContextRef = useRef<HookContext>();

  if (hookContextRef.current?.declaration !== declaration) {
    const view = createViewProxy<ViewProxyProps>(
      (props ?? {}) as ViewProxyProps,
    );

    const providers = [...extensionParamsProviders, provideView(view)];
    const controller = new declaration(providers);

    hookContextRef.current = {
      declaration,
      controller,
      view,
      isMounted: false,
    };
  }

  useEffect(() => {
    const context = hookContextRef.current!;

    if (context.isMounted) {
      context.view.update(props);
    }
  }, [props]);

  useEffect(() => {
    const context = hookContextRef.current!;

    context.isMounted = true;
    context.view.mount();

    return () => {
      context.view.unmount();
      context.controller.destroy();
    };
  }, [declaration]);

  return hookContextRef.current!.controller;
}
