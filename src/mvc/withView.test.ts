import { compute, syncEffect } from '../core';

import { ControllerConstructorError, declareController } from './controller';
import {
  createViewProxy,
  NRGY_EXTENSION_VIEW_KEY,
  provideView,
  withView,
} from './withView';

describe('withView()', () => {
  it('should provide binding of a view from UI to the controller', () => {
    type Props = { input: number };

    const TestController = declareController()
      .extend(withView<Props>())
      .apply(({ view }) => {
        const { input } = view.props;

        return {
          result: compute(() => input() * input()),
        };
      });

    const view = createViewProxy<Props>({ input: 2 });

    const controller = new TestController([provideView(view)]);

    expect(controller.result()).toBe(4);

    view.update({ input: 3 });
    expect(controller.result()).toBe(9);
  });

  it('should throw an error if no view is provided during controller creation', () => {
    const TestController = declareController()
      .extend(withView())
      .apply(() => ({}));

    expect(() => new TestController()).toThrowError(ControllerConstructorError);
  });
});

describe('provideView()', () => {
  it('should provide a view to the extension by extension params', () => {
    const view = createViewProxy();
    const provider = provideView(view);

    const result = provider({});
    expect(result[NRGY_EXTENSION_VIEW_KEY]).toBe(view);
  });
});

describe('ViewProxy', () => {
  describe('createViewProxy()', () => {
    it('should create a view proxy', () => {
      const view = createViewProxy();

      expect(view).toEqual(
        expect.objectContaining({
          props: expect.any(Object),

          onMount: expect.any(Function),
          onUpdate: expect.any(Function),
          onUnmount: expect.any(Function),

          mount: expect.any(Function),
          update: expect.any(Function),
          unmount: expect.any(Function),
        }),
      );
    });

    it('should create a view proxy with initial props', () => {
      const view = createViewProxy({ a: 1 });

      expect(view.props.a()).toEqual(1);
    });
  });

  describe('mount()', () => {
    it('should notify the view is mounted by onMount signal', () => {
      const view = createViewProxy();

      const spy = jest.fn();
      syncEffect(view.onMount, spy);
      view.mount();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('should notify the view is updated by onUpdate signal', () => {
      const view = createViewProxy({ value: 1 });

      const spy = jest.fn();
      syncEffect(view.onUpdate, spy);

      view.update({ value: 2 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith({ value: 2 });
      expect(view.props.value()).toBe(2);

      spy.mockClear();
      view.update();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith({});
      expect(view.props.value()).toBe(2);
    });

    it('should not fail if the new props contains the unknown keys', () => {
      const view = createViewProxy({ value: 1 });

      const spy = jest.fn();
      syncEffect(view.onUpdate, spy);

      view.update({ value: 2, unknown: 3 } as any);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith({ value: 2, unknown: 3 });

      expect(view.props.value()).toBe(2);
      expect((view.props as any)['unknown']).toEqual(undefined);
    });
  });

  describe('unmount()', () => {
    it('should notify the view is unmounted by onUnmount signal', () => {
      const view = createViewProxy();

      const spy = jest.fn();
      syncEffect(view.onUnmount, spy);
      view.unmount();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
