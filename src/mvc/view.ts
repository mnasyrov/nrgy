import { Atom, Signal } from '../core';

/**
 * ViewProps are the properties that are provided to the view
 */
export type ViewProps = Record<string, unknown>;

/**
 * ViewPropAtoms are the atoms wit View's props that are provided
 * to the controller by the ViewBinding
 */
export type ViewPropAtoms<TProps extends ViewProps> =
  TProps extends Record<string, never>
    ? Record<string, never>
    : Readonly<{
        [K in keyof TProps]: Atom<TProps[K]>;
      }>;

export type ViewStatus = 'unmounted' | 'mounted' | 'destroyed';

export const ViewStatuses = {
  unmounted: 'unmounted' as ViewStatus,
  mounted: 'mounted' as ViewStatus,
  destroyed: 'destroyed' as ViewStatus,
} as const;

/**
 * ViewBinding is the binding between the controller and the view
 */
export type ViewBinding<TProps extends ViewProps> = {
  /**
   * View's props
   */
  readonly props: ViewPropAtoms<TProps>;

  readonly status: Atom<ViewStatus>;

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
