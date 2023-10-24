import { Signal } from '../../src/core';
import { Action } from '../../src/core/action';

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
  result: Action<Result>;

  /** Provides a source event and a result of successful execution of the handler */
  done: Action<EffectResult<Event, Result>>;

  /** Provides an error emitter by a source (`event` is `undefined`)
   * or by the handler (`event` is not `undefined`) */
  error: Action<EffectError<Event, ErrorType>>;

  /** Provides a notification after execution of the handler for both success or error result  */
  final: Action<EffectNotification<Event, Result, ErrorType>>;

  /** Provides `true` if there is any execution of the handler in progress */
  pending: Signal<boolean>;

  /** Provides a count of the handler in progress */
  pendingCount: Signal<number>;
}>;
