import { Container } from 'ditox';

import { BaseService, ControllerDeclaration } from '../mvc';

import {
  DependencyContext,
  provideDependencyContainer,
} from './withInjections';

/**
 * This utility allows to use a controller with injections in DI bindings
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
