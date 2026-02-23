import { describe, expect, it, vi } from 'vitest';
import { createViewProxy } from './viewProxy';

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

      const spy = vi.fn();
      view.onMount(spy);
      view.mount();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('should not notify if the view is not mounted', () => {
      const view = createViewProxy({ value: 1 });

      const spy = vi.fn();
      view.onUpdate(spy);

      view.update({ value: 2 });
      expect(spy).toHaveBeenCalledTimes(0);
      expect(view.props.value()).toBe(1);

      spy.mockClear();
      view.mount();
      view.update({ value: 3 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith({ value: 3 });
      expect(view.props.value()).toBe(3);
    });

    it('should notify the view is updated by onUpdate signal', () => {
      const view = createViewProxy({ value: 1 });

      const spy = vi.fn();
      view.onUpdate(spy);

      view.mount();

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

      const spy = vi.fn();
      view.onUpdate(spy);

      view.mount();
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
      view.mount();

      const spy = vi.fn();
      view.onUnmount(spy);
      view.unmount();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('mount/destroy guards', () => {
    it('should not emit mount twice', () => {
      const view = createViewProxy();
      const onMount = vi.fn();
      view.onMount(onMount);

      view.mount();
      view.mount();

      expect(onMount).toHaveBeenCalledTimes(1);
    });

    it('should not emit unmount if not mounted', () => {
      const view = createViewProxy();
      const onUnmount = vi.fn();
      view.onUnmount(onUnmount);

      view.unmount();
      expect(onUnmount).toHaveBeenCalledTimes(0);
    });

    it('should emit unmount on destroy and ignore further destroys', () => {
      const view = createViewProxy();
      const onUnmount = vi.fn();
      view.onUnmount(onUnmount);

      view.mount();
      view.destroy();
      view.destroy();

      expect(onUnmount).toHaveBeenCalledTimes(1);
    });
  });
});
