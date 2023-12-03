import { createScope, Scope } from '../core/_public';
import type { AnyObject } from '../core/common';

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
export type Controller<Props extends AnyObject = AnyObject> = Props & {
  /** Dispose the controller and clean its resources */
  destroy: () => void;
};

export type BaseControllerContext = { scope: Scope };

type PartialControllerContext<T extends BaseControllerContext> = Omit<
  T,
  'scope'
> & {
  scope?: Scope;
};

export type BaseService = object | ((...args: any[]) => any);

type PartialController<TService extends BaseService> = TService & {
  /** Dispose the controller and clean its resources */
  destroy?: () => void;
};

/**
 * An error thrown when a controller is failed to be created
 */
export class ControllerConstructorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControllerConstructorError';
  }
}

export type ExtensionParams = Record<string, any>;

export type ExtensionFn<
  TSourceContext extends BaseControllerContext,
  TResultContext extends TSourceContext,
> = (
  sourceContext: TSourceContext,
  extensionParams?: ExtensionParams,
) => TResultContext;

export interface ControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> {
  (
    this: never,
    context?: Omit<TContext, 'scope'>,
    extensionParams?: ExtensionParams,
  ): Controller<TService>;

  new (
    context?: Omit<TContext, 'scope'>,
    extensionParams?: ExtensionParams,
  ): Controller<TService>;

  readonly extensions: ReadonlyArray<ExtensionFn<any, any>>;
}

export type InferredService<
  TDeclaration extends ControllerDeclaration<
    BaseControllerContext,
    BaseService
  >,
> = TDeclaration extends ControllerDeclaration<any, infer Service>
  ? Service
  : never;

export type ControllerFactory<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = (context: TContext) => PartialController<TService> | undefined | void;

type Builder<TContext extends BaseControllerContext> = {
  extend: <TResultContext extends TContext>(
    extension: ExtensionFn<TContext, TResultContext>,
  ) => Builder<TResultContext>;

  apply: <TService extends BaseService>(
    factory: ControllerFactory<TContext, TService>,
  ) => ControllerDeclaration<TContext, TService>;
};

function createBuilder<TContext extends BaseControllerContext>(
  extensions: Array<ExtensionFn<any, any>>,
): Builder<TContext> {
  return {
    extend<TResultContext extends TContext>(
      extension: ExtensionFn<TContext, TResultContext>,
    ): Builder<TResultContext> {
      const nextExtensions = extensions
        ? [...extensions, extension]
        : [extension];

      return createBuilder<TResultContext>(nextExtensions);
    },

    apply<TService extends BaseService>(
      factory: ControllerFactory<TContext, TService>,
    ): ControllerDeclaration<TContext, TService> {
      return createControllerDeclaration<TContext, TService>(
        factory,
        extensions,
      );
    },
  };
}

function createBaseControllerDeclaration<TService extends BaseService>(
  factory: ControllerFactory<BaseControllerContext, TService>,
): ControllerDeclaration<BaseControllerContext, TService> {
  return createControllerDeclaration(factory, []);
}

type DeclareControllerFn = typeof createBaseControllerDeclaration & {
  extend: Builder<BaseControllerContext>['extend'];
};

export const declareController: DeclareControllerFn = Object.assign(
  createBaseControllerDeclaration,
  {
    extend<TResultContext extends BaseControllerContext>(
      extension: ExtensionFn<BaseControllerContext, TResultContext>,
    ) {
      return createBuilder<TResultContext>([extension]);
    },
  },
);

function createControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  extensions: ExtensionFn<any, any>[],
): ControllerDeclaration<TContext, TService> {
  function constructorFn(
    this: unknown,
    partialContext?: PartialControllerContext<TContext>,
  ): Controller<TService> {
    return controllerConstructor<TContext, TService>(factory, partialContext);
  }

  constructorFn.extensions = extensions;

  return constructorFn as unknown as ControllerDeclaration<TContext, TService>;
}

function controllerConstructor<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  partialContext: undefined | PartialControllerContext<TContext>,
): Controller<TService> {
  const context = (
    partialContext
      ? partialContext.scope
        ? partialContext
        : { ...partialContext, scope: createScope() }
      : { scope: createScope() }
  ) as TContext;

  const scope = context.scope;

  const result = factory(context) ?? { destroy: undefined };

  const originalDestroy = result.destroy;
  if (originalDestroy) {
    scope.onDestroy(() => originalDestroy.call(result));
  }

  return Object.assign(result, {
    destroy: () => scope.destroy(),
  });
}

export function createController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(declaration: ControllerDeclaration<TContext, TService>): Controller<TService>;

export function createController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  extensionParams?: ExtensionParams,
): Controller<TService>;

export function createController<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  declaration: ControllerDeclaration<TContext, TService>,
  extensionParams?: ExtensionParams,
): Controller<TService> {
  const scope = createScope();
  const baseContext: BaseControllerContext = { scope };

  const context: TContext = declaration.extensions.reduce(
    (prevContext, extension) => extension(prevContext, extensionParams),
    baseContext,
  ) as TContext;

  return controllerConstructor<TContext, TService>(declaration, context);
}

export type ExtensionParamsProvider = (
  params: ExtensionParams,
) => ExtensionParams;

export function withExtensionParams(
  ...providers: ExtensionParamsProvider[]
): ExtensionParams {
  return providers.reduce((params, provider) => provider(params), {});
}
