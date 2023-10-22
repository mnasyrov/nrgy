import { createContainer, token } from 'ditox';

import { declareController } from './declareController';
import { InferredService } from './utilityTypes';

describe('declareController()', () => {
  it('should create a factory which accepts a DI container, resolves dependencies and constructs a controller', () => {
    const VALUE_TOKEN = token<number>();

    const controllerFactory = declareController(
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
});
