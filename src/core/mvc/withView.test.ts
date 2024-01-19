import { compute } from '../index';

import { declareController } from './controller';
import { createViewProxy, provideView, withView } from './withView';

describe('withView()', () => {
  it('should provide binding of a view from UI to the controller', () => {
    type Props = { input: number };

    const TestController = declareController
      .extend(withView<Props>())
      .apply(({ view }) => {
        const { input } = view.props;

        return {
          result: compute(() => input() * input()),
        };
      });

    const view = createViewProxy<Props>({ input: 2 });

    const controller = TestController.withProviders([
      provideView(view),
    ]).create();

    expect(controller.result()).toBe(4);

    view.update({ input: 3 });
    expect(controller.result()).toBe(9);
  });
});
