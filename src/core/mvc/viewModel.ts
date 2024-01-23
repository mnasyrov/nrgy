import { Atom } from '../common';

import {
  BaseControllerContext,
  ControllerDeclaration,
  createControllerDeclaration,
  ExtensionFn,
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

export class ViewModelDeclarationBuilder<
  TContext extends BaseControllerContext,
> {
  readonly extensions: Array<ExtensionFn<any, any>>;

  constructor(extensions: Array<ExtensionFn<any, any>> = []) {
    this.extensions = extensions;
  }

  extend<TResultContext extends TContext>(
    extension: ExtensionFn<TContext, TResultContext>,
  ): ViewModelDeclarationBuilder<TResultContext> {
    this.extensions.push(extension);

    return this as unknown as ViewModelDeclarationBuilder<TResultContext>;
  }

  apply<
    TViewModel extends BaseViewModel,
    TViewModelProps extends ViewProps = InferredViewModelProps<TViewModel>,
  >(
    factory: ViewModelFactory<
      TContext & ViewControllerContext<TViewModelProps>,
      TViewModel
    >,
  ): ControllerDeclaration<
    TContext & ViewControllerContext<TViewModelProps>,
    TViewModel
  > {
    this.extensions.push(withView<TViewModelProps>());

    return createControllerDeclaration<
      TContext & ViewControllerContext<TViewModelProps>,
      TViewModel
    >((context) => {
      const partialViewModel = factory(context);

      return Object.assign(partialViewModel, {
        props: context.view.props,
      }) as TViewModel;
    }, this.extensions);
  }
}

export function declareViewModel<
  TViewModel extends BaseViewModel,
  TViewModelProps extends ViewProps = InferredViewModelProps<TViewModel>,
>(
  factory: ViewModelFactory<ViewControllerContext<TViewModelProps>, TViewModel>,
): ControllerDeclaration<ViewControllerContext<TViewModelProps>, TViewModel>;

export function declareViewModel(): ViewModelDeclarationBuilder<BaseControllerContext>;

/**
 * @internal
 */
export function declareViewModel(factory?: ViewModelFactory<any, any>): any {
  const builder = new ViewModelDeclarationBuilder();

  return factory ? builder.apply(factory) : builder;
}
