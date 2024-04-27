import { compute } from '../core';

import { ControllerConstructorError, declareController } from './controller';
import { createViewProxy } from './viewProxy';
import { NRGY_EXTENSION_VIEW_KEY, provideView, withView } from './withView';

describe('withView()', () => {
  it('should provide binding of a view from UI to the controller', () => {
    type Props = { input: number };

    const TestController = declareController()
      .extend(withView<Props>())
      .apply(({ view }) => {
        const { input } = view.props;

        return {
          result: compute(() => input() * input()),
        };
      });

    const view = createViewProxy<Props>({ input: 2 });

    const controller = new TestController([provideView(view)]);

    expect(controller.result()).toBe(4);

    view.mount();
    view.update({ input: 3 });
    expect(controller.result()).toBe(9);
  });

  it('should throw an error if no view is provided during controller creation', () => {
    const TestController = declareController()
      .extend(withView())
      .apply(() => ({}));

    expect(() => new TestController()).toThrowError(ControllerConstructorError);
  });
});

describe('provideView()', () => {
  it('should provide a view to the extension by extension params', () => {
    const view = createViewProxy();
    const provider = provideView(view);

    const result = provider({});
    expect(result[NRGY_EXTENSION_VIEW_KEY]).toBe(view);
  });
});
