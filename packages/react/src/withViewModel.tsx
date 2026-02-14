import {
  type BaseViewModel,
  type InferViewModelProps,
  type ViewControllerContext,
  type ViewModelDeclaration,
} from '@nrgyjs/core';
import React, { type FC, type PropsWithChildren } from 'react';

import { useController } from './useController';

type InferHocComponent<
  TViewModel extends BaseViewModel,
  TComponentProps extends { viewModel: TViewModel },
  TViewModelProps = InferViewModelProps<TViewModel>,
> = FC<PropsWithChildren<Omit<TComponentProps, 'viewModel'> & TViewModelProps>>;

/**
 * Creates a higher-order React component that provides a view model for a given view component.
 *
 * @param viewModelDeclaration - Controller declaration
 */
export function withViewModel<TViewModel extends BaseViewModel>(
  viewModelDeclaration: ViewModelDeclaration<
    TViewModel,
    ViewControllerContext<InferViewModelProps<TViewModel>>
  >,
): <TComponentProps extends { viewModel: TViewModel }>(
  ViewComponent: React.ComponentType<PropsWithChildren<TComponentProps>>,
) => InferHocComponent<TViewModel, TComponentProps> {
  return (ViewComponent) => {
    return withViewModelImpl(viewModelDeclaration, ViewComponent);
  };
}

/**
 * @internal
 *
 * Creates a higher-order React component that provides a view model for a given view component.
 *
 * @param viewModelDeclaration - Controller declaration
 * @param ViewComponent - React component to be wrapped
 */
export function withViewModelImpl<
  TViewModel extends BaseViewModel,
  TComponentProps extends { viewModel: TViewModel },
  TViewModelProps = InferViewModelProps<TViewModel>,
  THocComponent = FC<
    PropsWithChildren<Omit<TComponentProps, 'viewModel'> & TViewModelProps>
  >,
>(
  viewModelDeclaration: ViewModelDeclaration<
    TViewModel,
    ViewControllerContext<InferViewModelProps<TViewModel>>
  >,
  ViewComponent: React.ComponentType<PropsWithChildren<TComponentProps>>,
): THocComponent {
  const HOC = (
    props: PropsWithChildren<
      Omit<TComponentProps, 'viewModel'> & TViewModelProps
    >,
  ) => {
    const { children, ...restProps } = props;

    const viewModel = useController(
      viewModelDeclaration,
      restProps as InferViewModelProps<TViewModel>,
    );

    return (
      <ViewComponent
        {...(restProps as any as TComponentProps)}
        viewModel={viewModel}
        children={children}
      />
    );
  };

  return HOC as THocComponent;
}
