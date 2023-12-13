import {
  BaseControllerContext,
  createController,
  declareController,
  ExtensionFn,
  ExtensionParams,
} from './controller';

describe('declareController()', () => {
  it('should create a controller', () => {
    const onDestroy = jest.fn();

    const TestController = declareController(({ scope }) => {
      const store = scope.atom(1);

      return {
        counter: store.asReadonly(),
        increase: () => store.update((state) => state + 1),
        decrease: () => store.update((state) => state - 1),
        destroy: () => onDestroy(),
      };
    });

    const controller = new TestController();

    const { counter, increase, decrease, destroy } = controller;
    expect(counter()).toBe(1);

    increase();
    expect(counter()).toBe(2);

    decrease();
    expect(counter()).toBe(1);

    destroy();
    expect(onDestroy).toHaveBeenCalled();
  });

  it('should defined a scope which is destroyed after destroying a controller', () => {
    const onDestroy = jest.fn();

    const TestController = declareController(({ scope }) => {
      scope.onDestroy(() => onDestroy());

      return {};
    });

    const controller = new TestController();

    controller.destroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('should defined a scope which can be destroyed twice: by a controller and by a proxy of destroy() function', () => {
    const onControllerDestroy = jest.fn();
    const onScopeDestroy = jest.fn();

    const TestController = declareController(({ scope }) => {
      scope.onDestroy(() => onScopeDestroy());

      return {
        destroy() {
          onControllerDestroy();
          scope.destroy();
        },
      };
    });

    const controller = new TestController();

    controller.destroy();
    expect(onControllerDestroy).toHaveBeenCalledTimes(1);
    expect(onScopeDestroy).toHaveBeenCalledTimes(1);
  });

  it('should declare a simple controller', () => {
    const TestController = declareController(({ scope }) => {
      const value = scope.atom(0);

      return {
        value: value.asReadonly(),
        increment: () => value.update((prev) => prev + 1),
      };
    });

    const controller = new TestController();

    expect(controller.value()).toBe(0);
    controller.increment();
    expect(controller.value()).toBe(1);
  });

  it('should declare a controller with a simple extension', () => {
    function withInitialValue(initialValue: number) {
      return (context: BaseControllerContext) => ({ ...context, initialValue });
    }

    const TestController = declareController
      .extend(withInitialValue(2))
      .apply(({ scope, initialValue }) => scope.atom(initialValue));

    const controller = new TestController({ initialValue: 3 });
    expect(controller()).toBe(3);
  });

  it('should supplement a controller with an extension', () => {
    function withInitialValue(initialValue: number) {
      return (context: BaseControllerContext) => ({ ...context, initialValue });
    }

    const TestController = declareController
      .extend(withInitialValue(2))
      .apply(({ scope, initialValue }) => scope.atom(initialValue));

    const controller = createController(TestController);
    expect(controller()).toBe(2);
  });

  it('should supplement a controller with an extension and its initializer', () => {
    const withEnvValue =
      (key: string): ExtensionFn<any, any> =>
      (context: BaseControllerContext, env?: ExtensionParams) => ({
        ...context,
        value: env?.[key],
      });

    const TestController = declareController
      .extend(withEnvValue('a'))
      .apply(({ value }) => ({ value }));

    expect(createController(TestController, { a: 3 }).value).toBe(3);
  });
});
