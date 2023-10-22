import { injectable, Token } from 'ditox';

import { AnyObject } from '../core/common';
import { Scope } from '../core/scope';

import { ControllerFactory, createController } from './controller';

export declare type DependencyProps = {
  [key: string]: unknown;
};
export declare type TokenProps<Props extends DependencyProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

export function declareController<
  Dependencies extends DependencyProps,
  Service extends AnyObject,
>(
  tokens: TokenProps<Dependencies>,
  factory: (deps: Dependencies, scope: Scope) => Service,
): ControllerFactory<Service> {
  return injectable(
    (deps) => createController((scope) => factory(deps as Dependencies, scope)),
    tokens,
  );
}
