import { Atom, compute } from '../core';

import { declareController } from './controller';
import { declareViewModel, ViewModel } from './viewModel';
import { createViewProxy } from './viewProxy';
import { provideView } from './withView';

describe('ControllerContext in ViewModel', () => {
  describe('create()', () => {
    const SquareController = declareController().apply(() => ({
      pow: (x: number) => x * x,
    }));

    const PowController = declareController()
      .params<{ y: number }>()
      .apply(({ params }) => ({
        pow: (x: number) => Math.pow(x, params.y),
      }));

    class SquareClassController extends declareController().getBaseClass() {
      pow(x: number) {
        return x * x;
      }
    }

    class PowClassController extends declareController()
      .params<{ y: number }>()
      .getBaseClass() {
      pow(x: number): number {
        return Math.pow(x, this.params.y);
      }
    }

    it('should construct functional and class-based child controllers', () => {
      type TestViewModelType = ViewModel<{
        increment: () => void;
        r1: Atom<number>;
        r2: Atom<number>;
        r3: Atom<number>;
        r4: Atom<number>;
      }>;

      const TestController = declareViewModel().apply<TestViewModelType>(
        ({ scope, create }) => {
          const square = create(SquareController);
          const cube = create(PowController, { y: 3 });
          const squareClass = create(SquareClassController);
          const cubeClass = create(PowClassController, { y: 3 });

          const x = scope.atom(1);

          return {
            increment: () => x.update((prev) => prev + 1),

            r1: compute(() => square.pow(x())),
            r2: compute(() => cube.pow(x())),
            r3: compute(() => squareClass.pow(x())),
            r4: compute(() => cubeClass.pow(x())),
          };
        },
      );

      const view = createViewProxy();
      const controller = new TestController([provideView(view)]);
      expect(controller.r1()).toBe(1);
      expect(controller.r2()).toBe(1);
      expect(controller.r3()).toBe(1);
      expect(controller.r4()).toBe(1);

      controller.increment();
      expect(controller.r1()).toBe(4);
      expect(controller.r2()).toBe(8);
      expect(controller.r3()).toBe(4);
      expect(controller.r4()).toBe(8);
    });
  });
});
