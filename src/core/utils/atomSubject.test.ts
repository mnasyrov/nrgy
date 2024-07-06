import { expectEffectContext } from '../../test/matchers';
import { isAtom } from '../atoms/atom';
import { syncEffect } from '../effects/effect';

import { createAtomSubject } from './atomSubject';

describe('AtomSubject', () => {
  describe('createAtomSubject()', () => {
    it('should create an atom subject', () => {
      const subject = createAtomSubject(1);

      expect(subject).toBeInstanceOf(Function);

      expect(subject).toEqual(
        expect.objectContaining({
          next: expect.any(Function),
          error: expect.any(Function),
          destroy: expect.any(Function),
          asDestroyable: expect.any(Function),
          asReadonly: expect.any(Function),
        }),
      );
    });
  });

  describe('asReadonly()', () => {
    it('should return a read-only representation of the subject', () => {
      const subject = createAtomSubject(1);
      const readonly = subject.asReadonly();

      expect(readonly).toBeInstanceOf(Function);
      expect(isAtom(readonly)).toBe(true);
      expect(readonly()).toBe(1);

      const keys = Object.keys(readonly);
      expect(keys).toEqual([]);

      expect(readonly).not.toEqual(
        expect.objectContaining({
          next: expect.any(Function),
          error: expect.any(Function),
          destroy: expect.any(Function),
          asDestroyable: expect.any(Function),
          asReadonly: expect.any(Function),
        }),
      );
    });
  });

  describe('asDestroyable()', () => {
    it('should return a destroyable representation of the subject', () => {
      const subject = createAtomSubject(1);
      const destroyable = subject.asDestroyable();

      expect(destroyable).toBeInstanceOf(Function);
      expect(isAtom(destroyable)).toBe(true);
      expect(destroyable()).toBe(1);

      expect(destroyable).toEqual(
        expect.objectContaining({
          destroy: expect.any(Function),
          asReadonly: expect.any(Function),
        }),
      );

      expect(destroyable).not.toEqual(
        expect.objectContaining({
          next: expect.any(Function),
          error: expect.any(Function),
          asDestroyable: expect.any(Function),
        }),
      );
    });
  });

  describe('next()', () => {
    it('should persist a value and return it on getting the value', () => {
      const subject = createAtomSubject(1);
      expect(subject()).toBe(1);

      subject.next(2);
      expect(subject()).toBe(2);
    });

    it('should emit a value and notify all subscribers', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();

      syncEffect(subject, spy);
      expect(spy).toHaveBeenLastCalledWith(1, expectEffectContext());

      subject.next(2);
      expect(spy).toHaveBeenLastCalledWith(2, expectEffectContext());

      subject.next(3);
      expect(spy).toHaveBeenLastCalledWith(3, expectEffectContext());

      const spy2 = jest.fn();
      syncEffect(subject, spy2);
      expect(spy2).toHaveBeenLastCalledWith(3, expectEffectContext());

      subject.next(4);
      expect(spy).toHaveBeenLastCalledWith(4, expectEffectContext());
      expect(spy2).toHaveBeenLastCalledWith(4, expectEffectContext());
    });

    it('should not notify subscribers with the same value twice', () => {
      const subject = createAtomSubject(0);
      const spy = jest.fn();

      syncEffect(subject, spy);
      spy.mockClear();

      subject.next(1);
      expect(spy).toHaveBeenCalledTimes(1);
      subject.next(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not notify if the subject is destroyed', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();

      const fx = syncEffect(subject, spy);
      spy.mockClear();

      fx.destroy();
      subject.next(2);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should not notify destroyed effects', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();

      const fx = syncEffect(subject, spy);
      fx.destroy();

      spy.mockClear();
      subject.next(2);
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('error()', () => {
    it('should persist an error and throw it on getting the value', () => {
      const subject = createAtomSubject(1);
      const error = new Error('test');

      subject.error(error);
      expect(() => subject()).toThrow(error);
    });

    it('should emit an error and notify all subscribers', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();
      const spyError = jest.fn();

      const fx = syncEffect(subject, spy);
      syncEffect(fx.onError, spyError);
      expect(spy).toHaveBeenLastCalledWith(1, expectEffectContext());

      subject.error(new Error('test'));
      expect(spyError).toHaveBeenLastCalledWith(
        new Error('test'),
        expectEffectContext(),
      );
    });

    it('should not notify if the subject is destroyed', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();
      const spyError = jest.fn();

      const fx = syncEffect(subject, spy);
      syncEffect(fx.onError, spyError);

      subject.destroy();

      spy.mockClear();
      spyError.mockClear();
      subject.error(new Error('test'));
      expect(spy).toHaveBeenCalledTimes(0);
      expect(spyError).toHaveBeenCalledTimes(0);
    });

    it('should not notify destroyed effects', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();
      const spyError = jest.fn();

      const fx = syncEffect(subject, spy);
      syncEffect(fx.onError, spyError);
      fx.destroy();

      spy.mockClear();
      spyError.mockClear();
      subject.error(new Error('test'));
      expect(spy).toHaveBeenCalledTimes(0);
      expect(spyError).toHaveBeenCalledTimes(0);
    });
  });
});
