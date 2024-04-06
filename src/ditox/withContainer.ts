import { Container } from 'ditox';

import {
  BaseControllerContext,
  ControllerConstructorError,
  ExtensionFn,
  ExtensionParams,
  ExtensionParamsProvider,
} from '../mvc';

/**
 * @internal
 *
 * Key for the container in the extension parameters
 */
export const DITOX_EXTENSION_CONTAINER_KEY = 'ditox.container';

export type DependencyContainerContext = BaseControllerContext & {
  container: Container;
};

/**
 * This extension provides DI container to the controller.
 */
export function withContainer<
  TSourceContext extends BaseControllerContext,
>(): ExtensionFn<TSourceContext, TSourceContext & { container: Container }> {
  return (sourceContext, extensionParams) => {
    const container = extensionParams?.[DITOX_EXTENSION_CONTAINER_KEY] as
      | Container
      | undefined;
    if (!container) {
      throw new ControllerConstructorError(
        'Dependency injection container is not provided',
      );
    }

    return { ...sourceContext, container };
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

/**
 * @internal
 *
 * Sets the dependency container in the extension parameters
 */
export function setDependencyContainerToParams(
  params: ExtensionParams,
  container: Container | undefined,
): void {
  params[DITOX_EXTENSION_CONTAINER_KEY] = container;
}
