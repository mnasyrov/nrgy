import React from 'react';

import { renderHook } from '@testing-library/react';
import { Container, token } from 'ditox';
import { DependencyContainer } from 'ditox-react';

import { withInjections } from '../ditox';
import { declareController } from '../mvc';
import { useController } from '../react';

import { DitoxNrgyReactExtension } from './DitoxNrgyReactExtension';

describe('DitoxNrgyReactExtension', () => {
  it('should fail in case there is no DitoxNrgyReactExtension in the render tree', () => {
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
        wrapper: DitoxNrgyReactExtension,
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
          <DitoxNrgyReactExtension>{children}</DitoxNrgyReactExtension>
        </DependencyContainer>
      ),
    });

    expect(result.current.getValue()).toBe(10);
  });

  it('should injects dependencies DitoxNrgyReactExtension is used before DependencyContainer in the render tree', () => {
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
        <DitoxNrgyReactExtension>
          <DependencyContainer binder={valueBinder}>
            {children}
          </DependencyContainer>
        </DitoxNrgyReactExtension>
      ),
    });

    expect(result.current.getValue()).toBe(10);
  });
});
