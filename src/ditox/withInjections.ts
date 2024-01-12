import { Container, resolveValues, Token } from 'ditox';

import {
  BaseControllerContext,
  ControllerConstructorError,
  ExtensionFn,
  ExtensionParams,
  ExtensionParamsProvider,
} from '../core/mvc';

const DITOX_EXTENSION_CONTAINER_KEY = 'ditox.container';

export type DependencyProps = {
  [key: string]: unknown;
};

export type DependencyTokenProps<Props extends DependencyProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

/**
 * This extension provides values from DI container to the controller.
 */
export function withInjections<
  TSourceContext extends BaseControllerContext,
  Dependencies extends DependencyProps,
>(
  tokens: DependencyTokenProps<Dependencies>,
): ExtensionFn<TSourceContext, TSourceContext & { deps: Dependencies }> {
  return (sourceContext, extensionParams) => {
    const container = extensionParams?.[DITOX_EXTENSION_CONTAINER_KEY] as
      | Container
      | undefined;
    if (!container) {
      throw new ControllerConstructorError(
        'Dependency injection container is not provided',
      );
    }

    const deps = resolveValues(container, tokens)[0] as Dependencies;

    return { ...sourceContext, deps };
  };
}

export function provideDependencyContainer(
  container: Container,
): ExtensionParamsProvider {
  return (params) => {
    setDependencyContainerToParams(params, container);
    return params;
  };
}

export function setDependencyContainerToParams(
  params: ExtensionParams,
  container: Container | undefined,
): void {
  params[DITOX_EXTENSION_CONTAINER_KEY] = container;
}
