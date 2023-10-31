import { Container, injectable } from 'ditox';

import { AnyObject, Atom } from '../core/common';
import { Scope } from '../core/scope';

import { Controller, createController } from './controller';
import { DependencyProps, TokenProps } from './declareController';

export type ViewControllerFactory<
  Service extends AnyObject,
  Params extends Atom<unknown>[],
> = (container: Container, ...params: Params) => Controller<Service>;

export function declareViewController<
  Service extends AnyObject,
  Params extends Atom<unknown>[],
>(
  factory: (scope: Scope, ...params: Params) => Service,
): ViewControllerFactory<Service, Params>;

export function declareViewController<
  Dependencies extends DependencyProps,
  Service extends AnyObject,
  Params extends Atom<unknown>[],
>(
  tokens: TokenProps<Dependencies>,
  factory: (
    deps: Dependencies,
    scope: Scope,
  ) => ((scope: Scope, ...params: Params) => Service) | Service,
): ViewControllerFactory<Service, Params>;

export function declareViewController<
  Dependencies extends DependencyProps,
  Service extends AnyObject,
  Params extends Atom<unknown>[],
  Factory extends (scope: Scope, ...params: Params) => Service,
  FactoryWithDependencies extends
    | ((deps: Dependencies, scope: Scope) => Service)
    | ((
        deps: Dependencies,
        scope: Scope,
      ) => (scope: Scope, ...params: Params) => Service),
>(
  tokensOrFactory: TokenProps<Dependencies> | Factory,
  factory?: FactoryWithDependencies,
): ViewControllerFactory<Service, Params> {
  return (container: Container, ...params: Params) => {
    if (typeof tokensOrFactory === 'function') {
      return createController((scope) => {
        return tokensOrFactory(scope, ...params);
      });
    }

    return injectable((dependencies) => {
      return createController((scope) => {
        const factoryValue = factory as FactoryWithDependencies;

        const result = factoryValue(dependencies as Dependencies, scope);

        if (typeof result === 'function') {
          return result(scope, ...params);
        }
        return result;
      });
    }, tokensOrFactory)(container);
  };
}
