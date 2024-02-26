import React, { FC } from 'react';

import {
  BaseService,
  ControllerDeclaration,
  ViewControllerContext,
  ViewProps,
} from '../mvc';

import { useController } from './useController';
import { ViewControllerProvider } from './ViewControllerProvider';

/**
 * Creates a higher-order React component that provides a controller for a given view component.
 *
 * @param controllerDeclaration - Controller declaration
 */
export function withViewController<
  TProps extends ViewProps,
  TService extends BaseService,
>(
  controllerDeclaration: ControllerDeclaration<
    ViewControllerContext<TProps>,
    TService
  >,
): (
  ViewComponent: React.ComponentType<TProps & { controller: TService }>,
) => FC<TProps> {
  return (ViewComponent) => {
    return function (props: TProps) {
      const controller = useController(controllerDeclaration, props);

      return (
        <ViewControllerProvider
          declaration={controllerDeclaration}
          controller={controller}
        >
          <ViewComponent {...props} controller={controller} />
        </ViewControllerProvider>
      );
    };
  };
}
