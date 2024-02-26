import { createContainer, token } from 'ditox';

import { ControllerConstructorError, declareController } from '../mvc';

import { provideDependencyContainer, withInjections } from './withInjections';

describe('withInjections()', () => {
  it('should provide a value from DI container to the controller', () => {
    const VALUE_TOKEN = token<number>();

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply((context) => {
        return { value: context.deps.value };
      });

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);

    const controller = new TestController([
      provideDependencyContainer(container),
    ]);
    expect(controller.value).toBe(1);
  });

  it('should throw an error if DI container is not provided', () => {
    const TestController = declareController()
      .extend(withInjections({ value: token<number>() }))
      .apply(() => ({ value: 1 }));

    expect(() => new TestController()).toThrow(
      new ControllerConstructorError(
        'Dependency injection container is not provided',
      ),
    );
  });
});
