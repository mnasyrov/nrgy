import type {
  BaseControllerContext,
  ExtensionFn,
  ExtensionParamsProvider,
} from '@nrgyjs/core';
import { ControllerConstructorError } from '@nrgyjs/core';
import type { Container } from 'ditox';

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
 * This extension provides a DI container to the controller.
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
  container: Container | undefined,
): ExtensionParamsProvider {
  return (params) => {
    params[DITOX_EXTENSION_CONTAINER_KEY] = container;
    return params;
  };
}
