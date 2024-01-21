import { Atom } from '../common';

import {
  BaseControllerContext,
  ControllerDeclaration,
  declareController,
} from './controller';
import {
  ViewControllerContext,
  ViewPropAtoms,
  ViewProps,
  withView,
} from './withView';

export type BaseViewModel = {
  props?: Record<string, Atom<unknown>>;
  state: Record<string, Atom<unknown>>;
};

export type ViewModel<T extends BaseViewModel> = T;

export type InferredViewModelProps<TViewModel extends BaseViewModel> =
  TViewModel['props'] extends ViewPropAtoms<infer InferredProps>
    ? InferredProps
    : never;

export type ViewModelFactory<
  TContext extends BaseControllerContext,
  TViewModel extends BaseViewModel,
> = (context: TContext) => Omit<TViewModel, 'props'>;

export function declareViewModel<
  TViewModel extends BaseViewModel,
  TViewModelProps extends ViewProps = InferredViewModelProps<TViewModel>,
>(
  factory: ViewModelFactory<ViewControllerContext<TViewModelProps>, TViewModel>,
): ControllerDeclaration<ViewControllerContext<TViewModelProps>, TViewModel> {
  return declareController
    .extend(withView<TViewModelProps>())
    .apply<TViewModel>((context) => {
      const partialViewModel = factory(context);

      return Object.assign(partialViewModel, {
        props: context.view.props,
      }) as TViewModel;
    });
}
