import { createScope, Scope } from '../index';

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

type PartialController<TService extends BaseService> = TService & {
  /** Dispose the controller and clean its resources */
  destroy?: () => void;
};

export type ControllerParams = Record<string, unknown>;

export type BaseControllerContext = { scope: Scope; params?: unknown };

export type ControllerParamsContext<TParams extends ControllerParams> =
  BaseControllerContext & { params: TParams };

export type InferContextParams<
  TContext extends BaseControllerContext,
  ElseType,
> = TContext extends ControllerParamsContext<infer InferredParams>
  ? InferredParams
  : ElseType;

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
  TContextExtension extends BaseControllerContext,
> = (
  sourceContext: TSourceContext,
  extensionParams?: ExtensionParams,
) => TSourceContext & TContextExtension;

export type ExtensionParamsProvider = (
  params: ExtensionParams,
) => ExtensionParams;

export function provideExtensionParams(
  extensionParams: ExtensionParams,
): ExtensionParamsProvider[] {
  return [() => extensionParams];
}

export type ControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
> = TContext extends ControllerParamsContext<infer TParams>
  ? {
      (
        params: TParams,
        providers?: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;
      new (
        params: TParams,
        providers?: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;

      /** @internal Keep the type for inference */
      readonly _contextType?: TContext;
    }
  : {
      (
        params?: undefined,
        providers?: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;
      new (
        params?: undefined,
        providers?: ReadonlyArray<ExtensionParamsProvider>,
      ): Controller<TService>;

      /** @internal Keep the type for inference */
      readonly _contextType?: TContext;
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

export function createControllerDeclaration<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  extensions: ExtensionFn<any, any>[],
): ControllerDeclaration<TContext, TService> {
  function constructorFn(
    params: TContext['params'],
    providers?: ReadonlyArray<ExtensionParamsProvider>,
  ): Controller<TService> {
    return controllerConstructor<TContext, TService>(
      factory,
      extensions,
      params,
      providers,
    );
  }

  return constructorFn as unknown as ControllerDeclaration<TContext, TService>;
}

function controllerConstructor<
  TContext extends BaseControllerContext,
  TService extends BaseService,
>(
  factory: ControllerFactory<TContext, TService>,
  extensions: ReadonlyArray<ExtensionFn<any, any>>,
  params: TContext['params'],
  providers?: ReadonlyArray<ExtensionParamsProvider>,
): Controller<TService> {
  const scope = createScope();

  const baseContext: BaseControllerContext = { scope, params: params ?? {} };

  const extensionParams = Array.isArray(providers)
    ? createExtensionParams(providers)
    : undefined;

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

function createExtensionParams(
  providers: ReadonlyArray<ExtensionParamsProvider>,
): ExtensionParams {
  return providers.reduce((params, provider) => provider(params), {});
}
