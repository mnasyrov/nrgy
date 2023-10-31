import { createContainer, token } from 'ditox';

import { atom } from '../core/atom';
import { Atom } from '../core/common';

import { declareViewController } from './declareViewController';
import { InferredService } from './utilityTypes';

describe('declareViewController()', () => {
  it('should create a factory which accepts a DI container, resolves dependencies and constructs a controller', () => {
    const VALUE_TOKEN = token<number>();

    const controllerFactory = declareViewController(
      { value: VALUE_TOKEN },
      ({ value }) => ({
        getValue: () => value * 10,
      }),
    );

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);

    const controller = controllerFactory(container);
    expect(controller.getValue()).toBe(10);

    // Check inferring of a service type
    type Service = InferredService<typeof controllerFactory>;
    const service: Service = controller;
    expect(service.getValue()).toBe(10);
  });

  it('should create a factory without DI dependencies', () => {
    const controllerFactory = declareViewController((scope) => {
      const $value = scope.atom(10);

      return {
        getValue: () => $value(),
      };
    });

    const container = createContainer();

    const controller = controllerFactory(container);
    expect(controller.getValue()).toBe(10);

    // Check inferring of a service type
    type Service = InferredService<typeof controllerFactory>;
    const service: Service = controller;
    expect(service.getValue()).toBe(10);
  });

  it('should create a factory which accepts resolved dependencies and parameters as Queries', () => {
    const VALUE_TOKEN = token<number>();

    const controllerFactory = declareViewController(
      { value: VALUE_TOKEN },
      ({ value }) =>
        (scope, arg: Atom<number>) => {
          const $value = scope.atom(10);
          return {
            getValue: () => value * $value() + arg(),
          };
        },
    );

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);

    const controller = controllerFactory(container, atom(2));
    expect(controller.getValue()).toBe(12);

    // Check inferring of a service type
    type Service = InferredService<typeof controllerFactory>;
    const service: Service = controller;
    expect(service.getValue()).toBe(12);
  });
});
