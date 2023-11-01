import { Atom } from '../../src/core/common';
import { Signal } from '../../src/core/signal';

export type EffectResult<Event, Value> = Readonly<{
  event: Event;
  result: Value;
}>;

export type EffectErrorOrigin = 'source' | 'handler';

export type EffectError<Event, ErrorType> = Readonly<
  | {
      origin: 'source';
      event?: undefined;
      error: any;
    }
  | {
      origin: 'handler';
      event: Event;
      error: ErrorType;
    }
>;

export type EffectNotification<Event, Result, ErrorType> = Readonly<
  | ({ type: 'result' } & EffectResult<Event, Result>)
  | ({ type: 'error' } & EffectError<Event, ErrorType>)
>;

/**
 * Details about performing the effect.
 */
export type EffectState<Event, Result = void, ErrorType = Error> = Readonly<{
  /** Provides a result of successful execution of the handler */
  result: Signal<Result>;

  /** Provides a source event and a result of successful execution of the handler */
  done: Signal<EffectResult<Event, Result>>;

  /** Provides an error emitter by a source (`event` is `undefined`)
   * or by the handler (`event` is not `undefined`) */
  error: Signal<EffectError<Event, ErrorType>>;

  /** Provides a notification after execution of the handler for both success or error result  */
  final: Signal<EffectNotification<Event, Result, ErrorType>>;

  /** Provides `true` if there is any execution of the handler in progress */
  pending: Atom<boolean>;

  /** Provides a count of the handler in progress */
  pendingCount: Atom<number>;
}>;
