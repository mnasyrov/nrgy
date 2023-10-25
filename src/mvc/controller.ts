import { Container } from 'ditox';

import { AnyObject } from '../core/common';
import { createScope, Scope } from '../core/scope';

/**
 * Effects and business logic controller.
 *
 * Implementation of the controller must provide `destroy()` method. It should
 * be used for closing subscriptions and disposing resources.
 *
 * @example
 * ```ts
 * type LoggerController = Controller<{
 *   log: (message: string) => void;
 * }>;
 * ```
 */
export type Controller<ControllerProps extends AnyObject = AnyObject> =
  Readonly<
    ControllerProps & {
      /** Dispose the controller and clean its resources */
      destroy: () => void;
    }
  >;

export type ControllerFactory<Service extends AnyObject> = (
  container: Container,
) => Controller<Service>;

export function createController<Service extends AnyObject>(
  factory: (scope: Scope) => Service & { destroy?: () => void },
): Controller<Service> {
  const scope = createScope();

  const controller = factory(scope);

  return {
    ...controller,

    destroy: () => {
      controller.destroy?.();
      scope.destroy();
    },
  };
}