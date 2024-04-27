import {
  BaseControllerContext,
  ControllerConstructorError,
  ExtensionFn,
  ExtensionParamsProvider,
} from './controller';
import { ViewBinding, ViewProps } from './view';

/**
 * @internal
 *
 * The key for the extension params of the view
 */
export const NRGY_EXTENSION_VIEW_KEY = 'nrgy.view';

/**
 * ViewControllerContext is the context with the view binding
 * that is provided to the controller
 */
export type ViewControllerContext<TProps extends ViewProps = ViewProps> =
  BaseControllerContext & { view: ViewBinding<TProps> };

/**
 * Utility type to infer the view props from the controller context
 */
export type InferViewPropsFromControllerContext<
  TContext extends BaseControllerContext,
  ElseType,
> =
  TContext extends ViewControllerContext<infer InferredProps>
    ? InferredProps
    : ElseType;

/**
 * withView is an extension that provides the view to the controller
 */
export function withView<TProps extends ViewProps = ViewProps>(): ExtensionFn<
  BaseControllerContext,
  ViewControllerContext<TProps>
> {
  return (sourceContext, extensionParams) => {
    const view = extensionParams?.[NRGY_EXTENSION_VIEW_KEY] as
      | ViewBinding<TProps>
      | undefined;
    if (!view) {
      throw new ControllerConstructorError('View is not provided');
    }

    return { ...sourceContext, view };
  };
}

/**
 * Provides the view binding to the controller
 */
export function provideView(view: ViewBinding<any>): ExtensionParamsProvider {
  return (params) => {
    params[NRGY_EXTENSION_VIEW_KEY] = view;
    return params;
  };
}
