import {
  BaseControllerContext,
  ControllerDeclaration,
  ExtensionFn,
  InferService,
} from './controller';

export type ControllerCompositionContext<
  TSourceContext extends BaseControllerContext,
  TDeclarations extends {
    [key: string]: ControllerDeclaration<TSourceContext, any>;
  },
> = BaseControllerContext & {
  controllers: {
    [K in keyof TDeclarations]: InferService<TDeclarations[K]>;
  };
};

/**
 * This extension creates child controllers and provides them to the controller.
 */
export function withControllers<
  TSourceContext extends BaseControllerContext,
  TDeclarations extends {
    [key: string]: ControllerDeclaration<TSourceContext, any>;
  },
>(
  declarations: TDeclarations,
): ExtensionFn<
  TSourceContext,
  TSourceContext & ControllerCompositionContext<TSourceContext, TDeclarations>
> {
  return (sourceContext, extensionParams) => {
    const { scope } = sourceContext;

    const providers = extensionParams ? [() => extensionParams] : [];

    const entries = Object.entries(declarations).map(([key, declaration]) => {
      const controller = scope.add(new declaration(providers));

      return [key, controller];
    });

    const controllers = Object.fromEntries(entries);

    return { ...sourceContext, controllers };
  };
}
