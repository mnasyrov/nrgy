import React, { FC } from 'react';

import {
  BaseService,
  ControllerDeclaration,
  ViewControllerContext,
  ViewProps,
} from '../core/mvc';

import { useController } from './useController';

export function createReactComponent<
  TService extends BaseService,
  TControllerProps extends ViewProps,
  TViewProps extends { controller: TService },
>(
  controllerDeclaration: ControllerDeclaration<
    ViewControllerContext<TControllerProps>,
    TService
  >,
  ViewComponent: FC<TViewProps>,
): FC<Omit<TViewProps, 'controller'> & TControllerProps> {
  const HOC: FC<Omit<TViewProps, 'controller'> & TControllerProps> = (
    props,
  ) => {
    const controller = useController(controllerDeclaration, props);

    return (
      <ViewComponent
        controller={controller}
        {...(props as any)}
      ></ViewComponent>
    );
  };

  return HOC;
}
