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
 * @param ViewComponent - React component to be wrapped
 * @param declaration - Controller declaration
 */
export function withViewController<
  TProps extends ViewProps,
  TService extends BaseService,
>(
  ViewComponent: React.ComponentType<TProps & { controller: TService }>,
  declaration: ControllerDeclaration<ViewControllerContext<TProps>, TService>,
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
