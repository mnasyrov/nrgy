import React from 'react';

import { renderHook } from '@testing-library/react';
import { Container, token } from 'ditox';
import { DependencyContainer } from 'ditox-react';

import { withInjections } from '../ditox';
import { declareController } from '../mvc';
import { useController } from '../mvc-react';

import { DitoxNrgyExtension } from './DitoxNrgyExtension';

describe('DitoxNrgyExtension', () => {
  it('should fail in case there is no DitoxNrgyExtension in the render tree', () => {
    const VALUE_TOKEN = token<number>();
    const factory = jest.fn();

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply(factory);

    expect(() =>
      renderHook(() => useController(TestController), {
        wrapper: DependencyContainer,
      }),
    ).toThrow(new Error('Dependency injection container is not provided'));
    expect(factory).toHaveBeenCalledTimes(0);
  });

  it('should fail in case there is no a dependency container in the render tree', () => {
    const VALUE_TOKEN = token<number>();
    const factory = jest.fn();

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply(factory);

    expect(() =>
      renderHook(() => useController(TestController), {
        wrapper: DitoxNrgyExtension,
      }),
    ).toThrow(new Error('Dependency injection container is not provided'));
    expect(factory).toHaveBeenCalledTimes(0);
  });

  it('should injects dependencies from a container in the render tree', () => {
    const VALUE_TOKEN = token<number>();
    const valueBinder = (container: Container) => {
      container.bindValue(VALUE_TOKEN, 1);
    };

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply(({ deps: { value } }) => ({
        getValue: () => value * 10,
      }));

    const { result } = renderHook(() => useController(TestController), {
      wrapper: ({ children }) => (
        <DependencyContainer binder={valueBinder}>
          <DitoxNrgyExtension>{children}</DitoxNrgyExtension>
        </DependencyContainer>
      ),
    });

    expect(result.current.getValue()).toBe(10);
  });

  it('should injects dependencies DitoxNrgyExtension is used before DependencyContainer in the render tree', () => {
    const VALUE_TOKEN = token<number>();
    const valueBinder = (container: Container) => {
      container.bindValue(VALUE_TOKEN, 1);
    };

    const TestController = declareController()
      .extend(withInjections({ value: VALUE_TOKEN }))
      .apply(({ deps: { value } }) => ({
        getValue: () => value * 10,
      }));

    const { result } = renderHook(() => useController(TestController), {
      wrapper: ({ children }) => (
        <DitoxNrgyExtension>
          <DependencyContainer binder={valueBinder}>
            {children}
          </DependencyContainer>
        </DitoxNrgyExtension>
      ),
    });

    expect(result.current.getValue()).toBe(10);
  });
});
