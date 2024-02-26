import { Atom } from '../core';

import {
  BaseController,
  BaseControllerContext,
  Controller,
  ControllerDeclaration,
  createControllerDeclaration,
  ExtensionFn,
  ExtensionParamsProvider,
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

export type InferViewModelProps<TViewModel extends BaseViewModel> =
  TViewModel['props'] extends ViewPropAtoms<infer InferredProps>
    ? InferredProps
    : never;

export type ViewModelFactory<
  TContext extends BaseControllerContext,
  TViewModel extends BaseViewModel,
> = (context: TContext) => Omit<TViewModel, 'props'>;

export abstract class BaseViewController<
  TViewModel extends BaseViewModel,
  TContext extends ViewControllerContext<InferViewModelProps<TViewModel>>,
> extends BaseController<TContext> {
  readonly view: TContext['view'] = this.context.view;
  readonly props: TContext['view']['props'] = this.context.view.props;

  abstract readonly state: TViewModel['state'];

  constructor(
    paramsOrProviders:
      | TContext['params']
      | ReadonlyArray<ExtensionParamsProvider>,
    extensions: ReadonlyArray<ExtensionFn<any, any>>,
  ) {
    super(paramsOrProviders, extensions);
  }
}

export type ViewModelDeclaration<
  TViewModel extends BaseViewModel,
  TContext extends ViewControllerContext<InferViewModelProps<TViewModel>>,
> = {
  /** @internal Keep the type for inference */
  readonly __contextType?: TContext;

  /** @internal Keep the type for inference */
  readonly __viewModelType?: TViewModel;

  new (): Controller<TViewModel>;
  new (
    providers: ReadonlyArray<ExtensionParamsProvider>,
  ): Controller<TViewModel>;
};

export type ViewModelClassDeclaration<
  TViewModel extends BaseViewModel,
  TContext extends ViewControllerContext<InferViewModelProps<TViewModel>>,
> = {
  /** @internal Keep the type for inference */
  readonly __contextType?: TContext;
  readonly __viewModelType?: TViewModel;

  new (): BaseViewController<TViewModel, TContext>;
  new (
    providers: ReadonlyArray<ExtensionParamsProvider>,
  ): BaseViewController<TViewModel, TContext>;
};

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

  apply<TViewModel extends BaseViewModel>(
    factory: ViewModelFactory<
      TContext & ViewControllerContext<InferViewModelProps<TViewModel>>,
      TViewModel
    >,
  ): ViewModelDeclaration<
    TViewModel,
    TContext & ViewControllerContext<InferViewModelProps<TViewModel>>
  > {
    type TViewModelProps = InferViewModelProps<TViewModel>;

    const extensions = [...this.extensions, withView<TViewModelProps>()];

    const result = createControllerDeclaration<
      TContext & ViewControllerContext<TViewModelProps>,
      TViewModel
    >((context) => {
      const partialViewModel = factory(context);

      return Object.assign(partialViewModel, {
        props: context.view.props,
      }) as TViewModel;
    }, extensions);

    return result as ViewModelDeclaration<
      TViewModel,
      TContext & ViewControllerContext<InferViewModelProps<TViewModel>>
    >;
  }

  getBaseClass<TViewModel extends BaseViewModel>(): ViewModelClassDeclaration<
    TViewModel,
    TContext & ViewControllerContext<InferViewModelProps<TViewModel>>
  > {
    type TViewModelProps = InferViewModelProps<TViewModel>;
    type TViewModelContext = TContext & ViewControllerContext<TViewModelProps>;

    const extensions = [...this.extensions, withView<TViewModelProps>()];

    abstract class BaseClass extends BaseViewController<
      TViewModel,
      TViewModelContext
    > {
      constructor();
      constructor(params: TContext['params']);
      constructor(providers: ReadonlyArray<ExtensionParamsProvider>);

      constructor(
        paramsOrProviders?:
          | TViewModelContext['params']
          | ReadonlyArray<ExtensionParamsProvider>,
      ) {
        super(paramsOrProviders, extensions);
      }
    }

    return BaseClass as unknown as ViewModelClassDeclaration<
      TViewModel,
      TViewModelContext
    >;
  }
}

export function declareViewModel<
  TViewModel extends BaseViewModel,
  TViewModelProps extends ViewProps = InferViewModelProps<TViewModel>,
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
