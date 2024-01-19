import React, { FC } from 'react';

import {
  BaseService,
  ControllerDeclaration,
  ViewControllerContext,
  ViewProps,
} from '../core/mvc';

import { useController } from './useController';

export function withViewController<
  TProps extends ViewProps,
  TController extends BaseService,
>(
  ViewComponent: React.ComponentType<TProps & { controller: TController }>,
  controllerDeclaration: ControllerDeclaration<
    ViewControllerContext<TProps>,
    TController
  >,
): FC<TProps> {
  return function (props: TProps) {
    const controller = useController(controllerDeclaration, props);

    return <ViewComponent {...props} controller={controller} />;
  };
}
