import { atom, Atom, signal, Signal, WritableAtom } from '../core';

import {
  BaseControllerContext,
  ControllerConstructorError,
  ExtensionFn,
  ExtensionParamsProvider,
} from './controller';

/**
 * @internal
 *
 * The key for the extension params of the view
 */
export const NRGY_EXTENSION_VIEW_KEY = 'nrgy.view';

/**
 * ViewProps are the properties that are provided to the view
 */
export type ViewProps = Record<string, unknown>;

/**
 * ViewPropAtoms are the atoms wit View's props that are provided
 * to the controller by the ViewBinding
 */
export type ViewPropAtoms<TProps extends ViewProps> = Readonly<{
  [K in keyof TProps]: Atom<TProps[K]>;
}>;

/**
 * ViewBinding is the binding between the controller and the view
 */
export type ViewBinding<TProps extends ViewProps> = {
  /**
   * View's props
   */
  readonly props: ViewPropAtoms<TProps>;

  /**
   * Signals that the view has been mounted
   */
  readonly onMount: Signal<void>;

  /**
   * Signals that the view has been updated.
   *
   * Partial<TProps> is the properties that were updated.
   */
  readonly onUpdate: Signal<Partial<TProps>>;

  /**
   * Signals that the view has been unmounted.
   */
  readonly onUnmount: Signal<void>;
};

/**
 * ViewProxy implements the binding between the controller and the view.
 *
 * It can be used to represent a view inside unit tests for the controller.
 */
export type ViewProxy<TProps extends ViewProps> = ViewBinding<TProps> & {
  /**
   * Mount the view
   */
  readonly mount: () => void;

  /**
   * Update the view.
   *
   * @param props - The props that were updated
   */
  readonly update: (props?: Partial<TProps>) => void;

  /**
   * Unmount the view
   */
  readonly unmount: () => void;
};

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
> = TContext extends ViewControllerContext<infer InferredProps>
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

// TODO: Added a version of createViewProxy() to create a view proxy without props
/**
 * Creates a view proxy that implements the view binding
 */
export function createViewProxy<TProps extends ViewProps>(
  initialProps: TProps,
): ViewProxy<TProps> {
  const props: Record<string, WritableAtom<any>> = {};
  const readonlyProps: Record<string, Atom<any>> = {};

  if (initialProps) {
    Object.keys(initialProps).forEach((key) => {
      const store = atom(initialProps[key]);
      props[key] = store;
      readonlyProps[key] = store.asReadonly();
    });
  }

  const onMount = signal<void>();
  const onUpdate = signal<Partial<TProps>>();
  const onUnmount = signal<void>();

  return {
    props: readonlyProps as ViewPropAtoms<TProps>,

    onMount,
    onUpdate,
    onUnmount,

    mount(): void {
      onMount();
    },

    update(nextProps?: Partial<TProps>): void {
      if (nextProps) {
        Object.keys(nextProps).forEach((key) => {
          props[key]?.set(nextProps[key]);
        });
      }

      onUpdate(nextProps ?? {});
    },

    unmount(): void {
      onUnmount();
    },
  };
}
