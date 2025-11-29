import { Emitter } from '../internals/emitter';
import { atom } from '../reactivity/atom';
import { Atom, SourceAtom } from '../reactivity/types';
import { createScope } from '../scope/createScope';
import { readonlyAtom } from '../utils/readonlyAtom';

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
  const props: Record<string, SourceAtom<any>> = {};
  const readonlyProps: Record<string, Atom<any>> = {};

  const scope = createScope();

  if (initialProps) {
    Object.keys(initialProps).forEach((key) => {
      const store = scope.atom(initialProps[key]);
      props[key] = store;
      readonlyProps[key] = readonlyAtom(store);
    });
  }

  const mountEmitter = new Emitter<void>();
  const updateEmitter = new Emitter<Partial<TProps>>();
  const unmountEmitter = new Emitter<void>();

  return {
    status: readonlyAtom(status),
    props: readonlyProps as ViewPropAtoms<TProps>,

    onMount: (listener) => mountEmitter.subscribe(listener),
    onUpdate: (listener) => updateEmitter.subscribe(listener),
    onUnmount: (listener) => unmountEmitter.subscribe(listener),

    mount(): void {
      if (status() === ViewStatuses.unmounted) {
        status.set(ViewStatuses.mounted);
        mountEmitter.emit();
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

      updateEmitter.emit(nextProps ?? {});
    },

    unmount(): void {
      if (status() === ViewStatuses.mounted) {
        status.set(ViewStatuses.unmounted);
        unmountEmitter.emit();
      }
    },

    destroy(): void {
      if (status() !== ViewStatuses.destroyed) {
        unmountEmitter.emit();
        status.set(ViewStatuses.destroyed);
        scope.destroy();
      }
    },
  };
}
