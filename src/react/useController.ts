import { useEffect, useRef } from 'react';

import {
  BaseControllerContext,
  BaseService,
  Controller,
  ControllerDeclaration,
  createViewProxy,
  provideView,
  ViewProxy,
} from '../core/mvc';
import { InferViewControllerProps } from '../core/mvc/withView';

import { useNrgyReactExtensionContext } from './NrgyReactExtension';

export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): TService;

export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TProps extends InferViewControllerProps<TContext, never>,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  props: TProps,
): TService;

export function useController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
  TProps extends InferViewControllerProps<TContext, undefined>,
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

  const extensionParamsProviders = useNrgyReactExtensionContext();

  const hookContextRef = useRef<HookContext>();
  const isMountedRef = useRef(false);

  if (!hookContextRef.current) {
    const view = createViewProxy<ViewProxyProps>(
      (props ?? {}) as ViewProxyProps,
    );

    const providers = [...extensionParamsProviders, provideView(view)];
    const controller = declaration.withProviders(providers).create();

    hookContextRef.current = { controller, view };
  }

  useEffect(() => {
    if (isMountedRef.current) {
      hookContextRef.current?.view.update(props);
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
