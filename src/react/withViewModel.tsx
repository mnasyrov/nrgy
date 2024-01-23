import React, { FC, PropsWithChildren } from 'react';

import {
  BaseViewModel,
  ControllerDeclaration,
  ViewControllerContext,
} from '../core/mvc';
import { InferredViewModelProps } from '../core/mvc/viewModel';

import { useController } from './useController';
import { ViewControllerProvider } from './ViewControllerProvider';

export function withViewModel<
  TViewModel extends BaseViewModel,
  TComponentProps extends { viewModel: TViewModel },
  TViewModelProps = InferredViewModelProps<TViewModel>,
  THocComponent = FC<
    PropsWithChildren<Omit<TComponentProps, 'viewModel'> & TViewModelProps>
  >,
>(
  ViewComponent: React.ComponentType<PropsWithChildren<TComponentProps>>,
  viewModelDeclaration: ControllerDeclaration<
    ViewControllerContext<InferredViewModelProps<TViewModel>>,
    TViewModel
  >,
): THocComponent {
  const HOC = (
    props: PropsWithChildren<
      Omit<TComponentProps, 'viewModel'> & TViewModelProps
    >,
  ) => {
    const { children, ...restProps } = props;

    const viewModel = useController(
      viewModelDeclaration,
      restProps as InferredViewModelProps<TViewModel>,
    );

    return (
      <ViewControllerProvider
        declaration={viewModelDeclaration}
        controller={viewModel}
      >
        <ViewComponent
          {...(restProps as any as TComponentProps)}
          viewModel={viewModel}
          children={children}
        />
      </ViewControllerProvider>
    );
  };

  return HOC as THocComponent;
}
