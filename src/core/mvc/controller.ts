import { createScope, Scope } from '../_public';

export type BaseService = object | ((...args: any[]) => any);

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
export type Controller<TService extends BaseService> = TService & {
  /** Dispose the controller and clean its resources */
  destroy: () => void;
};

type PartialController<TService extends BaseService> = TService & {
  /** Dispose the controller and clean its resources */
  destroy?: () => void;
};

export type ControllerParams = Record<string, any>;
export type ExtensionParams = Record<string, any>;

export type BaseControllerContext = { scope: Scope; params?: unknown };

/**
 * An error thrown when a controller is failed to be created
 */
export class ControllerConstructorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControllerConstructorError';
  }
}

export type ExtensionFn<
  TSourceContext extends BaseControllerContext,
  TResultContext extends TSourceContext,
> = (
  sourceContext: TSourceContext,
  extensionParams?: ExtensionParams,
) => TResultContext;

export type ControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = TContext extends { params: infer TParams }
  ? {
      (
        params: TParams,
        extensionParams?: ExtensionParams,
      ): Controller<TService>;
      new (
        params: TParams,
        extensionParams?: ExtensionParams,
      ): Controller<TService>;

      /** @internal Keep the type for inference */
      _contextType?: TContext;
    }
  : {
      (
        params?: undefined,
        extensionParams?: ExtensionParams,
      ): Controller<TService>;
      new (
        params?: undefined,
        extensionParams?: ExtensionParams,
      ): Controller<TService>;

      /** @internal Keep the type for inference */
      _contextType?: TContext;
    };

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
  params: <TParams extends ControllerParams>() => Builder<
    BaseControllerContext & { params: TParams }
  >;

  extend: Builder<BaseControllerContext>['extend'];
};

export const declareController: DeclareControllerFn = Object.assign(
  createBaseControllerDeclaration,
  {
    params<TParams extends ControllerParams>() {
      return createBuilder<BaseControllerContext & { params: TParams }>([]);
    },

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
    params: TContext['params'],
    extensionParams?: ExtensionParams,
  ): Controller<TService> {
    return controllerConstructor<TContext, TService>(
      factory,
      params,
      extensions,
      extensionParams,
    );
  }

  return constructorFn as unknown as ControllerDeclaration<TContext, TService>;
}

function controllerConstructor<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  params: TContext['params'],
  extensions: ReadonlyArray<ExtensionFn<any, any>>,
  extensionParams?: ExtensionParams,
): Controller<TService> {
  const scope = createScope();
  const baseContext: BaseControllerContext = { scope, params: params ?? {} };

  const context: TContext = extensions.reduce(
    (prevContext, extension) => extension(prevContext, extensionParams),
    baseContext,
  ) as TContext;

  const result = factory(context) ?? { destroy: undefined };

  const originalDestroy = result.destroy;
  if (originalDestroy) {
    scope.onDestroy(() => originalDestroy.call(result));
  }

  return Object.assign(result, {
    destroy: () => scope.destroy(),
  });
}

export type ExtensionParamsProvider = (
  params: ExtensionParams,
) => ExtensionParams;

export function withExtensionParams(
  ...providers: ExtensionParamsProvider[]
): ExtensionParams {
  return providers.reduce((params, provider) => provider(params), {});
}
