import { createScope, Scope, signal } from '../core';

/**
 * Base service type which is implemented by controllers
 */
export type BaseService = Record<string, any> | ((...args: any[]) => any);

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
export type Controller<TService extends BaseService = BaseService> =
  TService & {
    /** Dispose the controller and clean its resources */
    destroy: () => void;
  };

/**
 * @internal
 */
type PartialController<TService extends BaseService> = TService & {
  /** Dispose the controller and clean its resources */
  destroy?: () => void;
};

/**
 * Parameters for a controller
 */
export type ControllerParams = Record<string, unknown>;

/**
 * Base context for a controller
 */
export type BaseControllerContext = { scope: Scope; params?: unknown };

/**
 * Context with parameters for a controller
 */
export type ControllerParamsContext<TParams extends ControllerParams> =
  BaseControllerContext & { params: TParams };

/**
 * An error thrown when a controller is failed to be created
 */
export class ControllerConstructorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControllerConstructorError';
  }
}

/**
 * Parameters for an extension
 */
export type ExtensionParams = Record<string, any>;

/**
 * Extension function for a controller
 *
 * It extends a controller context with additional data
 *
 * @param sourceContext The source context
 * @param extensionParams Additional parameters for the extension
 *
 * @returns The extended context
 */
export type ExtensionFn<
  TSourceContext extends BaseControllerContext,
  TContextExtension extends BaseControllerContext,
> = (
  sourceContext: TSourceContext,
  extensionParams?: ExtensionParams,
) => TSourceContext & TContextExtension;

/**
 * Provider for arbitrary extension parameters
 *
 * It extends extension parameters with additional data and returns them.
 * An extension can use this data during creation of a controller context.
 */
export type ExtensionParamsProvider = (
  params: ExtensionParams,
) => ExtensionParams;

/**
 * Base declaration for a controller
 */
export type ControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> =
  TContext extends ControllerParamsContext<infer TParams>
    ? {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        /** @internal Keep the type for inference */
        readonly __paramsType?: TParams;

        /** @internal Keep the type for inference */
        readonly __serviceType?: TService;

        /**
         * Creates a new controller with the given parameters
         */
        new (params: TParams): Controller<TService>;

        /**
         * Creates a new controller with the given providers
         */
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): Controller<TService>;
      }
    : {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        /** @internal Keep the type for inference */
        readonly __serviceType?: TService;

        /**
         * Creates a new controller
         */
        new (): Controller<TService>;

        /**
         * Creates a new controller with the given providers
         */
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): Controller<TService>;
      };

/**
 * @internal
 *
 * Base class for controllers
 */
export abstract class BaseController<TContext extends BaseControllerContext> {
  protected readonly context: ControllerContext<TContext>;
  protected readonly scope: Scope;
  protected readonly params: TContext['params'];

  protected readonly onCreateSignal = signal({ sync: false });
  protected readonly onDestroySignal = signal({ sync: true });

  protected constructor(
    paramsOrProviders?:
      | TContext['params']
      | ReadonlyArray<ExtensionParamsProvider>,
    extensions?: ReadonlyArray<ExtensionFn<any, any>>,
  ) {
    this.context = createControllerContext(paramsOrProviders, extensions);

    this.scope = this.context.scope;
    this.params = this.context.params;

    this.scope.effect(this.onCreateSignal, () => this.onCreated());
    this.scope.effect(this.onDestroySignal, () => this.onDestroy());

    this.onCreateSignal();
  }

  /**
   * Called when the controller is created.
   *
   * This callback is called in a next microtask as soon as the controller is created.
   */
  protected onCreated(): void {
    // Do nothing
  }

  /**
   * Called when the controller is destroyed synchronously.
   */
  protected onDestroy(): void {
    // Do nothing
  }

  /**
   * Destroys the controller
   */
  destroy(): void {
    this.onDestroySignal();
    this.scope.destroy();
  }
}

/**
 * Base class declaration for controllers
 */
export type ControllerClassDeclaration<TContext extends BaseControllerContext> =
  TContext extends ControllerParamsContext<infer TParams>
    ? {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        /** @internal Keep the type for inference */
        readonly __paramsType?: TParams;

        /**
         * Creates a new controller with the given parameters
         */
        new (params: TParams): BaseController<TContext>;

        /**
         * Creates a new controller with the given providers
         */
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): BaseController<TContext>;
      }
    : {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        /**
         * Creates a new controller
         */
        new (): BaseController<TContext>;

        /**
         * Creates a new controller with the given providers
         */
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): BaseController<TContext>;
      };

/**
 * Utility type to infer the service type from a controller
 */
export type InferService<
  TDeclaration extends ControllerDeclaration<
    BaseControllerContext,
    BaseService
  >,
> =
  TDeclaration extends ControllerDeclaration<any, infer Service>
    ? Service
    : never;

/**
 * Utility type to infer the context type from a controller
 */
export type InferContext<T> =
  T extends BaseController<infer R1>
    ? R1
    : T extends ControllerDeclaration<infer R2, any>
      ? R2
      : never;

/**
 * Utility type to infer the params type from a controller
 */
export type InferContextParams<
  TContext extends BaseControllerContext,
  ElseType,
> =
  TContext extends ControllerParamsContext<infer InferredParams>
    ? InferredParams
    : ElseType;

export type ControllerContext<TContext extends BaseControllerContext> =
  TContext & {
    create<
      TContext extends BaseControllerContext,
      TService extends BaseService,
    >(
      declaration: ControllerDeclaration<TContext, TService>,
    ): Controller<TService>;

    create<
      TContext extends BaseControllerContext,
      TService extends BaseService,
      TParams extends InferContextParams<TContext, never>,
    >(
      declaration: ControllerDeclaration<TContext, TService>,
      params: TParams,
    ): Controller<TService>;
  };

/**
 * Factory function for a controller
 */
export type ControllerFactory<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = (
  context: ControllerContext<TContext>,
) => PartialController<TService> | undefined | void;

/**
 * @internal
 *
 * Builder for controller declarations
 */
export class ControllerDeclarationBuilder<
  TContext extends BaseControllerContext,
> {
  /**
   * Extensions that should be applied to the controller
   */
  readonly extensions: Array<ExtensionFn<any, any>>;

  /**
   * Creates a new builder
   *
   * @param extensions Extensions that should be applied to the controller
   */
  constructor(extensions: Array<ExtensionFn<any, any>> = []) {
    this.extensions = extensions;
  }

  /**
   * Declares the controller with the given parameters
   */
  params<TParams extends ControllerParams>(): ControllerDeclarationBuilder<
    TContext & ControllerParamsContext<TParams>
  > {
    return this as unknown as ControllerDeclarationBuilder<
      TContext & ControllerParamsContext<TParams>
    >;
  }

  /**
   * Declares the controller with the given extension
   */
  extend<TResultContext extends TContext>(
    extension: ExtensionFn<TContext, TResultContext>,
  ): ControllerDeclarationBuilder<TResultContext> {
    this.extensions.push(extension);

    return this as unknown as ControllerDeclarationBuilder<TResultContext>;
  }

  /**
   * Creates the controller declaration using declared context and the given factory
   */
  apply<TService extends BaseService>(
    factory: ControllerFactory<TContext, TService>,
  ): ControllerDeclaration<TContext, TService> {
    return createControllerDeclaration<TContext, TService>(
      factory,
      this.extensions,
    );
  }

  /**
   * Returns the base class for the controller using the declared context
   */
  getBaseClass(): ControllerClassDeclaration<TContext> {
    const extensions = this.extensions;

    return class extends BaseController<TContext> {
      constructor();
      constructor(params: TContext['params']);
      constructor(providers: ReadonlyArray<ExtensionParamsProvider>);

      constructor(
        paramsOrProviders?:
          | TContext['params']
          | ReadonlyArray<ExtensionParamsProvider>,
      ) {
        super(paramsOrProviders, extensions);
      }
    } as unknown as ControllerClassDeclaration<TContext>;
  }
}

/**
 * Returns a new controller declaration using the given factory
 */
export function declareController<TService extends BaseService>(
  factory: ControllerFactory<BaseControllerContext, TService>,
): ControllerDeclaration<BaseControllerContext, TService>;

/**
 * Returns the builder of controller declaration
 */
export function declareController(): ControllerDeclarationBuilder<BaseControllerContext>;

/**
 * @internal
 *
 * Returns the builder of controller declaration
 */
export function declareController(factory?: ControllerFactory<any, any>): any {
  const builder = new ControllerDeclarationBuilder();

  return factory ? builder.apply(factory) : builder;
}

/**
 * @internal
 *
 * Creates a new controller declaration
 */
export function createControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  extensions: ExtensionFn<any, any>[] | undefined,
): ControllerDeclaration<TContext, TService> {
  function constructorFn(
    paramsOrProviders:
      | TContext['params']
      | ReadonlyArray<ExtensionParamsProvider>,
  ): Controller<TService> {
    return controllerConstructor<TContext, TService>(
      factory,
      paramsOrProviders,
      extensions,
    );
  }

  return constructorFn as unknown as ControllerDeclaration<TContext, TService>;
}

/**
 * @internal
 *
 * Generic constructor of functional controllers
 */
function controllerConstructor<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  paramsOrProviders:
    | TContext['params']
    | ReadonlyArray<ExtensionParamsProvider>
    | undefined,
  extensions: ReadonlyArray<ExtensionFn<any, any>> | undefined,
): Controller<TService> {
  const context = createControllerContext(paramsOrProviders, extensions);
  const scope = context.scope;

  const controller = factory(context) ?? { destroy: undefined };

  const originalDestroy = controller.destroy;
  if (originalDestroy) {
    scope.onDestroy(() => originalDestroy.call(controller));
  }

  return Object.assign(controller, {
    destroy: () => scope.destroy(),
  });
}

/**
 * @internal
 *
 * Returns the params and providers from the given paramsOrProviders
 */
export function resolveParamsAndProviders<
  TContext extends BaseControllerContext,
>(
  paramsOrProviders?:
    | TContext['params']
    | ReadonlyArray<ExtensionParamsProvider>,
): {
  params: TContext['params'] | undefined;
  providers: ReadonlyArray<ExtensionParamsProvider>;
} {
  return Array.isArray(paramsOrProviders)
    ? { params: undefined, providers: paramsOrProviders }
    : { params: paramsOrProviders, providers: [] };
}

/**
 * @internal
 *
 * Creates a new controller context with applied extensions and providers
 */
export function createControllerContext<TContext extends BaseControllerContext>(
  paramsOrProviders?:
    | TContext['params']
    | ReadonlyArray<ExtensionParamsProvider>,
  extensions?: ReadonlyArray<ExtensionFn<any, any>>,
): ControllerContext<TContext> {
  const scope = createScope();

  const args = resolveParamsAndProviders(paramsOrProviders);

  const extensionParams =
    args.providers.length > 0
      ? createExtensionParams(args.providers)
      : undefined;

  const params = args.params ?? extensionParams?.controllerParams ?? {};

  const baseContext: BaseControllerContext = { scope, params };

  const context: TContext = (
    extensions
      ? extensions.reduce(
          (prevContext, extension) => extension(prevContext, extensionParams),
          baseContext,
        )
      : baseContext
  ) as TContext;

  const factoryContext: ControllerContext<TContext> = {
    ...context,

    create<
      TContext extends BaseControllerContext,
      TService extends BaseService,
    >(
      declaration: ControllerDeclaration<TContext, TService>,
      params?: InferContextParams<TContext, undefined>,
    ): Controller<TService> {
      const nextProviders = [
        ...args.providers,
        provideControllerParams(params),
      ];

      const controller = new declaration(nextProviders);

      return scope.add(controller);
    },
  };

  return factoryContext;
}

/**
 * @internal
 *
 * Creates a new extension parameters object
 */
function createExtensionParams(
  providers: ReadonlyArray<ExtensionParamsProvider>,
): ExtensionParams {
  return providers.reduce((params, provider) => provider(params), {});
}

/**
 * Provides the controller parameters
 */
export function provideControllerParams<
  TDeclaration extends ControllerDeclaration<any, any>,
  TContext extends TDeclaration extends ControllerDeclaration<
    infer InferredContext,
    any
  >
    ? InferredContext
    : never,
>(params: TContext['params']): ExtensionParamsProvider {
  return function (extensionParams) {
    extensionParams['controllerParams'] = params;
    return extensionParams;
  };
}

/**
 * Provides arbitrary extension parameters
 */
export function provideExtensionParams(
  params: ExtensionParams,
): ExtensionParamsProvider {
  return function (extensionParams) {
    return { ...extensionParams, ...params };
  };
}
