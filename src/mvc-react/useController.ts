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

export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): TService;

export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TProps extends InferViewPropsFromControllerContext<TContext, never>,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  props: TProps,
): TService;

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
    controller: Controller<TService>;
    view: ViewProxy<ViewProxyProps>;
  };

  const extensionParamsProviders = useNrgyControllerExtensionContext();

  const hookContextRef = useRef<HookContext>();
  const isMountedRef = useRef(false);

  if (!hookContextRef.current) {
    const view = createViewProxy<ViewProxyProps>(
      (props ?? {}) as ViewProxyProps,
    );

    const providers = [...extensionParamsProviders, provideView(view)];
    const controller = new declaration(providers);

    hookContextRef.current = { controller, view };
  }

  useEffect(() => {
    if (isMountedRef.current && hookContextRef.current) {
      hookContextRef.current.view.update(props);
    }
  }, [props]);

  useEffect(() => {
    hookContextRef.current?.view.mount();
    isMountedRef.current = true;

    return () => {
      hookContextRef.current?.view?.unmount();
      hookContextRef.current?.controller?.destroy();
    };
  }, []);

  return hookContextRef.current!.controller;
}
