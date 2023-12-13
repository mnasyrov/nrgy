import {
  BaseControllerContext,
  ControllerDeclaration,
  createController,
  ExtensionFn,
  InferredService,
} from './controller';

export type ControllerCompositionContext<
  TDeclarations extends {
    [key: string]: ControllerDeclaration<any, any>;
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
    [key: string]: ControllerDeclaration<any, any>;
  },
>(
  declarations: TDeclarations,
): ExtensionFn<
  TSourceContext,
  TSourceContext & ControllerCompositionContext<TDeclarations>
> {
  return (sourceContext, extensionParams) => {
    const { scope } = sourceContext;

    const entries = Object.entries(declarations).map(([key, declaration]) => {
      const controller = scope.add(
        createController(declaration, extensionParams),
      );

      return [key, controller];
    });

    const controllers = Object.fromEntries(entries);

    return { ...sourceContext, controllers };
  };
}
