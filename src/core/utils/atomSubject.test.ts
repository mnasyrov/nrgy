import { syncEffect } from '../reactivity/reactivity';

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
      expect(spy).toHaveBeenLastCalledWith(1);

      subject.next(2);
      expect(spy).toHaveBeenLastCalledWith(2);

      subject.next(3);
      expect(spy).toHaveBeenLastCalledWith(3);

      const spy2 = jest.fn();
      syncEffect(subject, spy2);
      expect(spy2).toHaveBeenLastCalledWith(3);

      subject.next(4);
      expect(spy).toHaveBeenLastCalledWith(4);
      expect(spy2).toHaveBeenLastCalledWith(4);
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

      syncEffect(subject, spy, { onError: spyError });
      expect(spy).toHaveBeenLastCalledWith(1);

      subject.error(new Error('test'));
      expect(spyError).toHaveBeenLastCalledWith(new Error('test'));
    });

    it('should not notify if the subject is destroyed', () => {
      const subject = createAtomSubject(1);
      const spy = jest.fn();
      const spyError = jest.fn();

      syncEffect(subject, spy, { onError: spyError });

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

      const fx = syncEffect(subject, spy, { onError: spyError });
      fx.destroy();

      spy.mockClear();
      spyError.mockClear();
      subject.error(new Error('test'));
      expect(spy).toHaveBeenCalledTimes(0);
      expect(spyError).toHaveBeenCalledTimes(0);
    });
  });
});
