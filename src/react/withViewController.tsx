import React, { FC } from 'react';

import {
  BaseService,
  ControllerDeclaration,
  ViewControllerContext,
  ViewProps,
} from '../core/mvc';

import { useController } from './useController';
import { ViewControllerProvider } from './ViewControllerProvider';

export function withViewController<
  TProps extends ViewProps,
  TController extends BaseService,
>(
  ViewComponent: React.ComponentType<TProps & { controller: TController }>,
  declaration: ControllerDeclaration<
    ViewControllerContext<TProps>,
    TController
  >,
): FC<TProps> {
  return function (props: TProps) {
    const controller = useController(declaration, props);

    return (
      <ViewControllerProvider declaration={declaration} controller={controller}>
        <ViewComponent {...props} controller={controller} />
      </ViewControllerProvider>
    );
  };
}
