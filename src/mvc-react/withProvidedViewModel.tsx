import React, { FC, PropsWithChildren } from 'react';

import { BaseViewModel, ViewControllerContext } from '../mvc';
import { InferViewModelProps, ViewModelDeclaration } from '../mvc/viewModel';

import { useProvidedViewController } from './ViewControllerProvider';

type InferHocComponent<
  TViewModel extends BaseViewModel,
  TComponentProps extends { viewModel: TViewModel },
> = FC<PropsWithChildren<Omit<TComponentProps, 'viewModel'>>>;

/**
 * Creates a higher-order React component that combines a given view component with the provided view model.
 *
 * @param viewModelDeclaration - Controller declaration
 */
export function withProvidedViewModel<TViewModel extends BaseViewModel>(
  viewModelDeclaration: ViewModelDeclaration<
    TViewModel,
    ViewControllerContext<InferViewModelProps<TViewModel>>
  >,
): <TComponentProps extends { viewModel: TViewModel }>(
  ViewComponent: React.ComponentType<PropsWithChildren<TComponentProps>>,
) => InferHocComponent<TViewModel, TComponentProps> {
  return (ViewComponent) => {
    return withProvidedViewModelImpl(viewModelDeclaration, ViewComponent);
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
export function withProvidedViewModelImpl<
  TViewModel extends BaseViewModel,
  TComponentProps extends { viewModel: TViewModel },
  THocComponent = FC<PropsWithChildren<Omit<TComponentProps, 'viewModel'>>>,
>(
  viewModelDeclaration: ViewModelDeclaration<
    TViewModel,
    ViewControllerContext<InferViewModelProps<TViewModel>>
  >,
  ViewComponent: React.ComponentType<PropsWithChildren<TComponentProps>>,
): THocComponent {
  const HOC = (
    props: PropsWithChildren<Omit<TComponentProps, 'viewModel'>>,
  ) => {
    const { children, ...restProps } = props;

    const viewModel = useProvidedViewController(viewModelDeclaration);

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
