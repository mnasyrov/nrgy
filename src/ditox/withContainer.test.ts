import { createContainer, token } from 'ditox';

import { ControllerConstructorError, declareController } from '../mvc';

import { provideDependencyContainer, withContainer } from './withContainer';

describe('withContainer()', () => {
  it('should provide a value from DI container to the controller', () => {
    const VALUE_TOKEN = token<number>();

    const TestController = declareController()
      .extend(withContainer())
      .apply((context) => {
        return { value: context.container.resolve(VALUE_TOKEN) };
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
      .extend(withContainer())
      .apply(() => ({ value: 1 }));

    expect(() => new TestController()).toThrow(
      new ControllerConstructorError(
        'Dependency injection container is not provided',
      ),
    );
  });
});
