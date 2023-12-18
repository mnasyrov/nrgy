import { atom, Atom, signal, Signal, WritableAtom } from '../_public';

import {
  BaseControllerContext,
  ControllerConstructorError,
  ExtensionFn,
  ExtensionParamsProvider,
} from './controller';

const NRGY_EXTENSION_VIEW_KEY = 'nrgy.view';

export type ViewProps = Record<string, unknown>;

export type ViewPropAtoms<TProps extends ViewProps> = Readonly<{
  [K in keyof TProps]: Atom<TProps[K]>;
}>;

export type ViewBinding<TProps extends ViewProps> = {
  readonly props: ViewPropAtoms<TProps>;

  readonly onMount: Signal<void>;
  readonly onUpdate: Signal<Partial<TProps>>;
  readonly onUnmount: Signal<void>;
};

export type ViewProxy<TProps extends ViewProps> = ViewBinding<TProps> & {
  readonly mount: () => void;
  readonly update: (props?: Partial<TProps>) => void;
  readonly unmount: () => void;
};

export function viewProps<TProps extends ViewProps>(): TProps | undefined {
  return undefined;
}

export type ViewControllerContext<TProps extends ViewProps> =
  BaseControllerContext & { view: ViewBinding<TProps> };

export type InferViewControllerProps<
  TContext extends BaseControllerContext,
  ElseType,
> = TContext extends ViewControllerContext<infer InferredProps>
  ? InferredProps
  : ElseType;

/**
 * This extension provides a view presentation to the controller.
 */
export function withView<
  TSourceContext extends BaseControllerContext,
  TProps extends ViewProps,
>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sample?: TProps,
): ExtensionFn<TSourceContext, TSourceContext & ViewControllerContext<TProps>> {
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

export function provideView(view: ViewBinding<any>): ExtensionParamsProvider {
  return (params) => {
    params[NRGY_EXTENSION_VIEW_KEY] = view;
    return params;
  };
}

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
