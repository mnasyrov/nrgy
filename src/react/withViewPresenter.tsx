import React, { FC, PropsWithChildren } from 'react';

import {
  BaseViewModel,
  ControllerDeclaration,
  ViewControllerContext,
  ViewProps,
} from '../core/mvc';

import { useController } from './useController';

export function withViewPresenter<
  TProps extends ViewProps,
  TViewModel extends BaseViewModel,
>(
  ViewComponent: React.ComponentType<
    PropsWithChildren<{ viewModel: TViewModel }>
  >,
  presenter: ControllerDeclaration<ViewControllerContext<TProps>, TViewModel>,
): FC<PropsWithChildren<TProps>> {
  return function (props: PropsWithChildren<TProps>) {
    const { children, ...controllerProps } = props;

    const viewModel = useController(presenter, controllerProps as TProps);

    return <ViewComponent viewModel={viewModel} children={children} />;
  };
}
