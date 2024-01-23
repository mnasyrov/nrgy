import { compute } from '../index';

import { declareController } from './controller';
import { withControllers } from './withControllers';
import { createViewProxy, provideView, withView } from './withView';

describe('withControllers()', () => {
  it('should construct and provides child controllers', () => {
    const StepController = declareController(({ scope }) => {
      const step = scope.atom(1);

      return {
        step: step.asReadonly(),
        increment: () => step.update((value) => value + 1),
      };
    });

    const TestController = declareController()
      .extend(withControllers({ stepController: StepController }))
      .apply(({ scope, controllers }) => {
        const { stepController } = controllers;

        const value = scope.atom(0);

        return {
          result: compute(() => value() + stepController.step()),

          incrementStep: stepController.increment,
        };
      });

    const controller = TestController();
    expect(controller.result()).toBe(1);

    controller.incrementStep();
    expect(controller.result()).toBe(2);
  });

  it('should share the same context to child controllers', () => {
    type TestProps = { a: number };

    const StepController = declareController()
      .extend(withView<TestProps>())
      .apply(({ view }) => {
        const result = view.props.a;

        return { result };
      });

    const TestController = declareController()
      .extend(withView<TestProps>())
      .extend(withControllers({ stepController: StepController }))
      .apply(({ controllers, view }) => {
        const { stepController } = controllers;
        const { a } = view.props;

        const result = compute(() => a() * stepController.result());

        return { result };
      });

    const testView = createViewProxy<TestProps>({ a: 2 });

    const controller = TestController.withProviders([
      provideView(testView),
    ]).create();
    expect(controller.result()).toBe(4);

    testView.update({ a: 3 });
    expect(controller.result()).toBe(9);
  });
});
