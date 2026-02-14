import type { BaseService, ControllerDeclaration } from '@nrgyjs/core';
import type { Container } from 'ditox';

import { provideDependencyContainer } from './withContainer';
import type { DependencyContext } from './withInjections';

/**
 * This utility allows using a controller with injections in DI bindings
 */
export function applyInjections<
  TContext extends DependencyContext<any>,
  TService extends BaseService,
>(
  controller: ControllerDeclaration<TContext, TService>,
): (container: Container) => TService {
  return (container) => {
    return new controller([provideDependencyContainer(container)]);
  };
}
