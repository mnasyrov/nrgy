import { compute } from '../_public';

import { declareController } from './controller';
import { withControllers } from './withControllers';

describe('withControllers()', () => {
  it('should construct and provides child controllers', () => {
    const StepController = declareController(({ scope }) => {
      const step = scope.atom(1);

      return {
        step: step.asReadonly(),
        increment: () => step.update((value) => value + 1),
      };
    });

    const TestController = declareController
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
});
