import { bindModule, createContainer, declareModule, token } from 'ditox';

import { declareController } from '../mvc';

import { applyInjections } from './applyInjections';
import { withInjections } from './withInjections';

describe('applyInjections()', () => {
  it('should provide DI container to the "withInjections" extension of the controller', () => {
    const VALUE_TOKEN = token<number>();

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply((context) => {
        return { value: context.deps.value };
      });

    const TEST_MODULE = declareModule({
      factory: applyInjections(TestController),
    });

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);
    bindModule(container, TEST_MODULE);

    const controller = container.resolve(TEST_MODULE.token);
    expect(controller.value).toBe(1);
  });
});
