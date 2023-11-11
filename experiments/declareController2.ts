import { AnyObject } from '../src/core/common';
import { createScope, Scope } from '../src/core/scope';
import { Controller } from '../src/mvc/controller';

export function createController<Service extends AnyObject>(
  factory: (scope: Scope) => Service & { destroy?: () => void },
): Controller<Service> {
  const scope = createScope();

  const controller = factory(scope);
  scope.onDestroy(() => controller.destroy?.());

  return {
    ...controller,

    destroy: () => scope.destroy(),
  };
}

export type ControllerContext = { readonly scope: Scope };

export type ControllerFactory<Service extends AnyObject> =
  () => Controller<Service>;

export type ContextExtendFn = <T extends ControllerContext, R extends T>(
  context: T,
) => R;

type DeclareFn = <Context extends ControllerContext, Service extends AnyObject>(
  factory: (context: Context) => Service,
) => ControllerFactory<Service>;

type DeclareControllerFn = {
  <Service extends AnyObject>(
    factory: (context: ControllerContext) => Service,
  ): ControllerFactory<Service>;

  readonly extend: <T extends ControllerContext, R extends T>(
    context: T,
  ) => <Service extends AnyObject>(
    factory: (context: R) => Service,
  ) => ControllerFactory<Service>;
};

export function declareController<Service extends AnyObject>(
  factory: (context: ControllerContext) => Service,
): ControllerFactory<Service> {
  return () => {
    return createController((scope) => {
      const context: ControllerContext = { scope };

      return factory(context);
    });
  };
}

Object.assign(declareController, {
  extend: (...extenders: any[]) => {
    return <Service extends AnyObject>(
      factory: (context: ControllerContext) => Service,
    ) => {
      return () => {
        return createController((scope) => {
          const initial: ControllerContext = { scope };
          const context = extenders.reduce(
            (c, extender) => extender(c),
            initial,
          );

          return factory(context);
        });
      };
    };
  },
});
