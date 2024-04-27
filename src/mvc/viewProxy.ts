import { Atom, atom, createScope, signal, WritableAtom } from '../core';

import {
  ViewBinding,
  ViewPropAtoms,
  ViewProps,
  ViewStatus,
  ViewStatuses,
} from './view';

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

  /**
   * Destroy the view
   */
  readonly destroy: () => void;
};

/**
 * Creates a view proxy that implements the view binding
 */
export function createViewProxy(): ViewProxy<Record<string, never>>;

/**
 * Creates a view proxy that implements the view binding
 */
export function createViewProxy<TProps extends ViewProps>(
  initialProps: TProps,
): ViewProxy<TProps>;

/**
 * Creates a view proxy that implements the view binding
 */
export function createViewProxy<TProps extends ViewProps>(
  initialProps?: TProps,
): ViewProxy<TProps> {
  const status = atom<ViewStatus>(ViewStatuses.unmounted);
  const props: Record<string, WritableAtom<any>> = {};
  const readonlyProps: Record<string, Atom<any>> = {};

  const scope = createScope();

  if (initialProps) {
    Object.keys(initialProps).forEach((key) => {
      const store = scope.atom(initialProps[key]);
      props[key] = store;
      readonlyProps[key] = store.asReadonly();
    });
  }

  const onMount = signal<void>({ sync: true });
  const onUpdate = signal<Partial<TProps>>({ sync: true });
  const onUnmount = signal<void>({ sync: true });

  return {
    status: status.asReadonly(),
    props: readonlyProps as ViewPropAtoms<TProps>,

    onMount,
    onUpdate,
    onUnmount,

    mount(): void {
      if (status() === ViewStatuses.unmounted) {
        status.set(ViewStatuses.mounted);
        onMount();
      }
    },

    update(nextProps?: Partial<TProps>): void {
      if (status() !== ViewStatuses.mounted) {
        return;
      }

      if (nextProps) {
        Object.keys(nextProps).forEach((key) => {
          props[key]?.set(nextProps[key]);
        });
      }

      onUpdate(nextProps ?? {});
    },

    unmount(): void {
      if (status() === ViewStatuses.mounted) {
        status.set(ViewStatuses.unmounted);
        onUnmount();
      }
    },

    destroy(): void {
      if (status() !== ViewStatuses.destroyed) {
        onUnmount();
        status.set(ViewStatuses.destroyed);
        scope.destroy();
      }
    },
  };
}
