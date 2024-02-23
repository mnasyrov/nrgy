import { createScope, Scope, signal } from '../index';

/**
 * Base service type which is implemented by controllers
 */
export type BaseService = Record<string, unknown> | ((...args: any[]) => any);

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

export type ControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = TContext extends ControllerParamsContext<infer TParams>
  ? {
      /** @internal Keep the type for inference */
      readonly __contextType?: TContext;

      new (params: TParams): Controller<TService>;
      new (
        providers: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;
    }
  : {
      /** @internal Keep the type for inference */
      readonly __contextType?: TContext;

      new (): Controller<TService>;
      new (
        providers: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;
    };

/**
 * @internal
 */
export abstract class BaseController<TContext extends BaseControllerContext> {
  protected readonly context: TContext;
  protected readonly scope: Scope;
  protected readonly params: TContext['params'];

  protected readonly onCreateSignal = signal({ sync: false });
  protected readonly onDestroySignal = signal({ sync: true });

  protected constructor(
    paramsOrProviders?:
      | TContext['params']
      | ReadonlyArray<ExtensionParamsProvider>,
    extensions: ReadonlyArray<ExtensionFn<any, any>> = [],
  ) {
    this.context = createControllerContext(paramsOrProviders, extensions);
    this.scope = this.context.scope;
    this.params = this.context.params;

    this.scope.onDestroy(() => this.onDestroySignal());

    this.scope.effect(this.onCreateSignal, () => this.onCreated());
    this.scope.effect(this.onDestroySignal, () => this.onDestroy());

    this.onCreateSignal();
  }

  protected onCreated(): void {
    // Do nothing
  }

  protected onDestroy(): void {
    // Do nothing
  }

  destroy(): void {
    this.scope.destroy();
  }
}

export type ControllerClassDeclaration<TContext extends BaseControllerContext> =
  TContext extends ControllerParamsContext<infer TParams>
    ? {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        new (params: TParams): BaseController<TContext>;
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): BaseController<TContext>;
      }
    : {
        /** @internal Keep the type for inference */
        readonly __contextType?: TContext;

        new (): BaseController<TContext>;
        new (
          providers: ReadonlyArray<ExtensionParamsProvider>,
        ): BaseController<TContext>;
      };

export type InferService<
  TDeclaration extends ControllerDeclaration<
    BaseControllerContext,
    BaseService
  >,
> = TDeclaration extends ControllerDeclaration<any, infer Service>
  ? Service
  : never;

export type InferContext<T> = T extends BaseController<infer R1>
  ? R1
  : T extends ControllerDeclaration<infer R2, any>
    ? R2
    : never;

export type InferContextParams<
  TContext extends BaseControllerContext,
  ElseType,
> = TContext extends ControllerParamsContext<infer InferredParams>
  ? InferredParams
  : ElseType;

export type ControllerFactory<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = (context: TContext) => PartialController<TService> | undefined | void;

export class ControllerDeclarationBuilder<
  TContext extends BaseControllerContext,
> {
  readonly extensions: Array<ExtensionFn<any, any>>;

  constructor(extensions: Array<ExtensionFn<any, any>> = []) {
    this.extensions = extensions;
  }

  params<TParams extends ControllerParams>() {
    return this as unknown as ControllerDeclarationBuilder<
      ControllerParamsContext<TParams>
    >;
  }

  extend<TResultContext extends TContext>(
    extension: ExtensionFn<TContext, TResultContext>,
  ): ControllerDeclarationBuilder<TResultContext> {
    this.extensions.push(extension);

    return this as unknown as ControllerDeclarationBuilder<TResultContext>;
  }

  apply<TService extends BaseService>(
    factory: ControllerFactory<TContext, TService>,
  ): ControllerDeclaration<TContext, TService> {
    return createControllerDeclaration<TContext, TService>(
      factory,
      this.extensions,
    );
  }

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

export function declareController<TService extends BaseService>(
  factory: ControllerFactory<BaseControllerContext, TService>,
): ControllerDeclaration<BaseControllerContext, TService>;

export function declareController(): ControllerDeclarationBuilder<BaseControllerContext>;

/**
 * @internal
 */
export function declareController(factory?: ControllerFactory<any, any>): any {
  const builder = new ControllerDeclarationBuilder();

  return factory ? builder.apply(factory) : builder;
}

/**
 * @internal
 */
export function createControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  extensions: ExtensionFn<any, any>[],
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

function controllerConstructor<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  paramsOrProviders:
    | TContext['params']
    | ReadonlyArray<ExtensionParamsProvider>
    | undefined,
  extensions: ReadonlyArray<ExtensionFn<any, any>>,
): Controller<TService> {
  const context: TContext = createControllerContext(
    paramsOrProviders,
    extensions,
  );

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

export function createControllerContext<TContext extends BaseControllerContext>(
  paramsOrProviders:
    | TContext['params']
    | ReadonlyArray<ExtensionParamsProvider>
    | undefined,
  extensions: ReadonlyArray<ExtensionFn<any, any>>,
): TContext {
  const scope = createScope();

  let params: TContext['params'] | undefined;
  let providers: ReadonlyArray<ExtensionParamsProvider> | undefined;

  if (Array.isArray(paramsOrProviders)) {
    providers = paramsOrProviders;
  } else {
    params = paramsOrProviders;
  }

  const extensionParams = providers
    ? createExtensionParams(providers)
    : undefined;

  if (!params && extensionParams?.controllerParams) {
    params = extensionParams.controllerParams;
  }

  const baseContext: BaseControllerContext = { scope, params: params ?? {} };

  const context: TContext = (
    extensions.length > 0
      ? extensions.reduce(
          (prevContext, extension) => extension(prevContext, extensionParams),
          baseContext,
        )
      : baseContext
  ) as TContext;

  return context;
}

function createExtensionParams(
  providers: ReadonlyArray<ExtensionParamsProvider>,
): ExtensionParams {
  return providers.reduce((params, provider) => provider(params), {});
}

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

export function provideExtensionParams(
  params: ExtensionParams,
): ExtensionParamsProvider {
  return function (extensionParams) {
    return { ...extensionParams, ...params };
  };
}
