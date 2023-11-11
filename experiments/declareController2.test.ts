import { createContainer, token } from 'ditox';

import { compute } from '../src/core/_public';
import { atom } from '../src/core/atom';
import { Atom } from '../src/core/common';
import { declareViewController } from '../src/mvc/declareViewController';
import { InferredService } from '../src/mvc/utilityTypes';

declare function declareViewController2(...args: any[]): any;

describe('declareViewController()', () => {
  it('should use the new API', () => {
    const VALUE_TOKEN = token<number>();

    const controllerFactory = declareViewController2.extend(
      withInjections({ value: VALUE_TOKEN }),
      withViewProps<{ factor: number }>(),
      withViewLifecycle(),
    )(({ scope, props }) => {
      const { value: initialValue, factor } = props;

      // UI lifecycle callbacks
      scope.onInit(() => {});
      scope.onMount(() => {});
      scope.onUnmount(() => {});
      scope.onDestroy(() => {});

      const store = atom(initialValue);

      const increment = () => store.update((prev) => prev + 1);

      return {
        value: compute(() => store() * factor()),

        increment,
      };
    });

    const container = createContainer();
    container.bindValue(VALUE_TOKEN, 1);

    const controller = controllerFactory(container);

    // Check inferring of a service type
    type Service = InferredService<typeof controllerFactory>;
    const service: Service = controller;
    expect(service.value()).toBe(10);
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
