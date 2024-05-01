import React, { FC } from 'react';

import { render, renderHook } from '@testing-library/react';

import { effect } from '../core';
import {
  BaseControllerContext,
  declareController,
  ExtensionFn,
  ExtensionParamsProvider,
  withView,
} from '../mvc';
import { expectEffectContext } from '../test/matchers';
import { flushMicrotasks } from '../test/testUtils';

import { NrgyControllerExtension } from './NrgyControllerExtension';
import { useController } from './useController';

describe('useController()', () => {
  it('should create a controller by the factory and destroy it on unmount', () => {
    const action = jest.fn();
    const destroy = jest.fn();

    const TestController = declareController(() => ({
      value: 1,
      action,
      destroy,
    }));

    const { result, unmount } = renderHook(() => useController(TestController));

    expect(result.current.value).toBe(1);

    result.current.action();
    expect(action).toHaveBeenCalledTimes(1);

    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('should not recreate the controller with empty dependencies after rerendering', () => {
    const destroy = jest.fn();

    const TestController = declareController(() => ({ destroy }));

    const { result, rerender, unmount } = renderHook(() =>
      useController(TestController),
    );

    const controller1 = result.current;
    rerender();
    const controller2 = result.current;

    expect(controller1 === controller2).toBe(true);

    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('should be able to replace the controller by the new implementation', () => {
    const destroy1 = jest.fn();
    const destroy2 = jest.fn();

    const TestController1 = declareController(() => ({
      value: 1,
      destroy: destroy1,
    }));

    const TestController2 = declareController(() => ({
      value: 2,
      destroy: destroy2,
    }));

    const { result, rerender, unmount } = renderHook(
      ({ controller }) => useController(controller),
      { initialProps: { controller: TestController1 } },
    );

    expect(result.current.value).toBe(1);

    rerender({ controller: TestController2 });
    expect(result.current.value).toBe(2);
    expect(destroy1).toHaveBeenCalledTimes(1);
    expect(destroy2).toHaveBeenCalledTimes(0);

    destroy1.mockClear();
    unmount();
    expect(destroy1).toHaveBeenCalledTimes(0);
    expect(destroy2).toHaveBeenCalledTimes(1);
  });
});

describe('useController() and withView() extension', () => {
  it('should call lifecycle signals using syncEffect()', () => {
    const mountCallback = jest.fn();
    const updateCallback = jest.fn();
    const unmountCallback = jest.fn();

    const ViewController = declareController()
      .extend(withView<{ value: number }>())
      .apply(({ scope, view: { onMount, onUnmount, onUpdate, props } }) => {
        effect(props.value, () => {});

        scope.syncEffect(onMount, mountCallback);
        scope.syncEffect(onUpdate, updateCallback);
        scope.syncEffect(onUnmount, unmountCallback);
      });

    const { rerender, unmount } = renderHook(
      ({ value }) => useController(ViewController, { value }),
      { initialProps: { value: 1 } },
    );

    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(0);
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 2 });
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 2 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 2 });
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(2);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 2 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 3 });
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(3);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 3 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    unmount();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(3);
    expect(unmountCallback).toHaveBeenCalledTimes(1);
  });

  it('should call lifecycle signals using async effect()', async () => {
    const mountCallback = jest.fn();
    const updateCallback = jest.fn();
    const unmountCallback = jest.fn();

    const ViewController = declareController()
      .extend(withView<{ value: number }>())
      .apply(({ scope, view: { onMount, onUnmount, onUpdate, props } }) => {
        effect(props.value, () => {});

        scope.effect(onMount, mountCallback);
        scope.effect(onUpdate, updateCallback);
        scope.effect(onUnmount, unmountCallback);
      });

    const { rerender, unmount } = renderHook(
      ({ value }) => useController(ViewController, { value }),
      { initialProps: { value: 1 } },
    );

    await flushMicrotasks();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(0);
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 2 });
    await flushMicrotasks();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 2 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 2 });
    await flushMicrotasks();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(2);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 2 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    rerender({ value: 3 });
    await flushMicrotasks();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(3);
    expect(updateCallback).toHaveBeenCalledWith(
      { value: 3 },
      expectEffectContext(),
    );
    expect(unmountCallback).toHaveBeenCalledTimes(0);

    unmount();
    await flushMicrotasks();
    expect(mountCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(3);
    expect(unmountCallback).toHaveBeenCalledTimes(1);
  });

  it('should provide props as atoms to the controller', () => {
    const ViewController = declareController()
      .extend(withView<{ value: number }>())
      .apply(({ view: { props } }) => props);

    const { result, rerender, unmount } = renderHook(
      ({ value }) => useController(ViewController, { value }),
      { initialProps: { value: 1 } },
    );

    expect(result.current.value()).toBe(1);

    rerender({ value: 2 });
    expect(result.current.value()).toBe(2);

    unmount();
    expect(result.current.value()).toBe(2);
  });

  it('should not recreate the controller if a dependency is changed', () => {
    const destroy = jest.fn();

    const ViewController = declareController()
      .extend(withView<{ value: number }>())
      .apply(({ view }) => ({
        value: view.props.value,
        destroy,
      }));

    const { result, rerender, unmount } = renderHook(
      ({ value }) => useController(ViewController, { value }),
      { initialProps: { value: 1 } },
    );

    const controller1 = result.current;
    expect(controller1.value()).toBe(1);

    rerender({ value: 1 });
    const controller2 = result.current;
    expect(controller2).toBe(controller1);
    expect(controller2.value()).toBe(1);

    rerender({ value: 2 });
    const controller3 = result.current;
    expect(controller3).toBe(controller1);
    expect(controller3.value()).toBe(2);

    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

describe('useController() and a custom extension', () => {
  function withCustomExtension<
    TSourceContext extends BaseControllerContext,
  >(): ExtensionFn<
    TSourceContext,
    TSourceContext & { customValue: string | undefined }
  > {
    return (sourceContext, extensionParams) => ({
      ...sourceContext,
      customValue: extensionParams?.['customValue'],
    });
  }

  const TestController = declareController()
    .extend(withCustomExtension())
    .apply(({ customValue }) => ({ customValue }));

  const TestController2 = declareController()
    .extend(withCustomExtension())
    .apply(({ customValue }) => ({ customValue: 'foo-' + customValue }));

  it('should use an extension context provided by NrgyControllerExtension', () => {
    let result: any;

    const TestComponent: FC = () => {
      result = useController(TestController);
      return null;
    };

    const customValueProvider: ExtensionParamsProvider = (params) => ({
      ...params,
      customValue: 'value1',
    });

    render(
      <NrgyControllerExtension provider={customValueProvider}>
        <TestComponent />
      </NrgyControllerExtension>,
    );

    expect(result).toEqual({
      customValue: 'value1',
      destroy: expect.any(Function),
    });
  });

  it('should use NrgyControllerExtension', () => {
    const customValueProvider: ExtensionParamsProvider = (params) => ({
      ...params,
      customValue: 'value1',
    });

    let ControllerDeclaration: any = TestController;

    const { result, rerender } = renderHook(
      () => useController(TestController),
      {
        wrapper: ({ children }) => (
          <NrgyControllerExtension provider={customValueProvider}>
            {children}
          </NrgyControllerExtension>
        ),
      },
    );

    expect(result.current).toEqual({
      customValue: 'value1',
      destroy: expect.any(Function),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ControllerDeclaration = TestController2;
    rerender();

    expect(result.current).toEqual({
      customValue: 'value1',
      destroy: expect.any(Function),
    });
  });
});
