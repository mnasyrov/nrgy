import { compute } from '../_public';

import { declareController, withExtensionParams } from './controller';
import { createViewProxy, provideView, viewProps, withView } from './withView';

describe('withView()', () => {
  it('should provide binding of a view from UI to the controller', () => {
    type Props = { input: number };

    const TestController = declareController
      .extend(withView(viewProps<Props>()))
      .apply(({ view }) => {
        const { input } = view.props;

        return {
          result: compute(() => input() * input()),
        };
      });

    const view = createViewProxy<Props>({ input: 2 });
    const controller = new TestController(
      undefined,
      withExtensionParams(provideView(view)),
    );
    expect(controller.result()).toBe(4);

    view.update({ input: 3 });
    expect(controller.result()).toBe(9);
  });
});
