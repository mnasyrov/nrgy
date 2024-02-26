import React, { FC } from 'react';

import { render, renderHook } from '@testing-library/react';

import { declareController } from '../mvc';

import {
  useOptionalViewController,
  useProvidedViewController,
  ViewControllerProvider,
} from './ViewControllerProvider';

describe('useProvidedViewController()', () => {
  it('should return the controller from ViewProviderContext', () => {
    const TestController = declareController(() => ({ foo: 'bar' }));

    const controller = new TestController();

    const { result } = renderHook(
      () => useProvidedViewController(TestController),
      {
        wrapper: ({ children }) => (
          <ViewControllerProvider
            declaration={TestController}
            controller={controller}
          >
            {children}
          </ViewControllerProvider>
        ),
      },
    );

    expect(result.current).toBe(controller);
    expect(result.current.foo).toBe('bar');
  });

  it('should throw an error if the controller is not provided', () => {
    const TestController = declareController(() => ({ foo: 'bar' }));

    expect(() =>
      renderHook(() => useProvidedViewController(TestController)),
    ).toThrow(new Error('Controller is not provided'));
  });
});

describe('useOptionalViewController()', () => {
  it('should return the controller from ViewProviderContext', () => {
    const TestController = declareController(() => ({ foo: 'bar' }));

    const controller = new TestController();

    const { result } = renderHook(
      () => useOptionalViewController(TestController, undefined),
      {
        wrapper: ({ children }) => (
          <ViewControllerProvider
            declaration={TestController}
            controller={controller}
          >
            {children}
          </ViewControllerProvider>
        ),
      },
    );

    expect(result.current).toBe(controller);
    expect(result.current?.foo).toBe('bar');
  });

  it('should return undefined if the controller is not provided', () => {
    const TestController = declareController(() => ({ foo: 'bar' }));

    const { result } = renderHook(() =>
      useOptionalViewController(TestController),
    );

    expect(result.current).toBeUndefined();
  });

  it('should return a custom value if the controller is not provided', () => {
    const TestController = declareController(() => ({ foo: 'bar' }));

    const { result } = renderHook(() =>
      useOptionalViewController(TestController, { foo: 'baz' }),
    );

    expect(result.current).toEqual({ foo: 'baz' });
  });
});

describe('ViewControllerProvider', () => {
  it('should provide the view controller to the render tree', () => {
    const TestController = declareController()
      .params<{ value: number }>()
      .apply(({ params }) => ({ value: params.value }));

    const controller1 = new TestController({ value: 1 });
    const controller2 = new TestController({ value: 2 });

    expect(controller1.value).toBe(1);
    expect(controller2.value).toBe(2);

    const spy = jest.fn();

    const TestComponent: FC = () => {
      const controller = useProvidedViewController(TestController);
      spy(controller.value);

      return null;
    };

    render(
      <ViewControllerProvider
        declaration={TestController}
        controller={controller1}
      >
        <TestComponent />

        <ViewControllerProvider
          declaration={TestController}
          controller={controller2}
        >
          <TestComponent />
        </ViewControllerProvider>
      </ViewControllerProvider>,
    );

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 1);
    expect(spy).toHaveBeenNthCalledWith(2, 2);
  });
});
