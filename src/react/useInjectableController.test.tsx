import React from 'react';

import { renderHook } from '@testing-library/react';
import { Container, token } from 'ditox';
import { DependencyContainer } from 'ditox-react';

import { declareController } from '../mvc/_public';

import { useInjectableController } from './useInjectableController';

describe('useInjectableController()', () => {
  it('should fail in case there is no a dependency container in the render tree', () => {
    const factory = jest.fn();
    const viewController = declareController({}, factory);

    expect(() =>
      renderHook(() => useInjectableController(viewController)),
    ).toThrow(
      new Error('Container is not provided by DependencyContainer component'),
    );
    expect(factory).toHaveBeenCalledTimes(0);
  });

  it('should not fail in case there is a dependency container in the render tree', () => {
    const viewController = declareController({}, () => ({}));

    expect(() =>
      renderHook(() => useInjectableController(viewController), {
        wrapper: ({ children }) => (
          <DependencyContainer>{children}</DependencyContainer>
        ),
      }),
    ).not.toThrow();
  });

  it('should injects dependencies from a container in the render tree', () => {
    const VALUE_TOKEN = token<number>();
    const valueBinder = (container: Container) => {
      container.bindValue(VALUE_TOKEN, 1);
    };

    const onDestroy = jest.fn();

    const viewController = declareController(
      { value: VALUE_TOKEN },
      ({ value }) => ({
        getValue: () => value * 10,
        destroy: () => onDestroy(),
      }),
    );

    const { result, unmount } = renderHook(
      () => useInjectableController(viewController),
      {
        wrapper: ({ children }) => (
          <DependencyContainer binder={valueBinder}>
            {children}
          </DependencyContainer>
        ),
      },
    );

    expect(result.current.getValue()).toBe(10);
    expect(onDestroy).toHaveBeenCalledTimes(0);

    unmount();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});
