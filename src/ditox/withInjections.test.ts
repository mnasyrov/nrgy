import { createContainer, token } from 'ditox';

import { declareController } from '../core/mvc';

import { provideDependencyContainer, withInjections } from './withInjections';

describe('withInjections()', () => {
  it('should provide a value from DI container to the controller', () => {
    const VALUE_TOKEN = token<number>();

    const TestController = declareController
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply((context) => {
        return { value: context.deps.value };
      });

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);

    const controller = TestController.withProviders([
      provideDependencyContainer(container),
    ]).create();
    expect(controller.value).toBe(1);
  });
});
