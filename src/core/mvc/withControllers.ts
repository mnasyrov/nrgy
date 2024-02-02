import {
  BaseControllerContext,
  ControllerDeclaration,
  ExtensionFn,
  InferredService,
} from './controller';

export type ControllerCompositionContext<
  TSourceContext extends BaseControllerContext,
  TDeclarations extends {
    [key: string]: ControllerDeclaration<TSourceContext, any>;
  },
> = BaseControllerContext & {
  controllers: {
    [K in keyof TDeclarations]: InferredService<TDeclarations[K]>;
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

    const extensionParamsProvider = extensionParams
      ? [() => extensionParams]
      : undefined;

    const entries = Object.entries(declarations).map(([key, declaration]) => {
      const controller = scope.add(
        new declaration(undefined, extensionParamsProvider),
      );

      return [key, controller];
    });

    const controllers = Object.fromEntries(entries);

    return { ...sourceContext, controllers };
  };
}
