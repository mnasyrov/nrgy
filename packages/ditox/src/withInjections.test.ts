import { ControllerConstructorError, declareController } from '@nrgyjs/core';
import { createContainer, token } from 'ditox';
import { describe, expect, it } from 'vitest';

import { provideDependencyContainer } from './withContainer';
import { withInjections } from './withInjections';

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

  it('should share extensions with children controllers', () => {
    const TOKEN = token<number>();

    const ChildController = declareController()
      .extend(withInjections({ value: TOKEN }))
      .apply(({ deps }) => {
        return { value: deps.value };
      });

    const TestController = declareController().apply(({ create }) => {
      const child = create(ChildController);

      return { value: child.value };
    });

    const container = createContainer();
    container.bindValue(TOKEN, 1);

    const controller = new TestController([
      provideDependencyContainer(container),
    ]);
    expect(controller.value).toBe(1);
  });
});
