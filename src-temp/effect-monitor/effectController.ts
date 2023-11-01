import { action, isActionObserved } from '../../src/core/action';
import { compute } from '../../src/core/compute';
import { createScope } from '../../src/core/scope';
import { Controller } from '../../src/mvc/controller';

import {
  EffectError,
  EffectNotification,
  EffectResult,
  EffectState,
} from './effectState';

const GLOBAL_EFFECT_UNHANDLED_ERROR_EMITTER =
  action<EffectError<unknown, unknown>>();

export const GLOBAL_EFFECT_UNHANDLED_ERRORS =
  GLOBAL_EFFECT_UNHANDLED_ERROR_EMITTER;

function emitGlobalUnhandledError(
  effectError: EffectError<unknown, unknown>,
): void {
  if (isActionObserved(GLOBAL_EFFECT_UNHANDLED_ERROR_EMITTER)) {
    GLOBAL_EFFECT_UNHANDLED_ERROR_EMITTER(effectError);
  } else {
    console.error('Uncaught error in EffectMonitor', effectError);
  }
}

export type EffectController<Event, Result, ErrorType = Error> = Controller<{
  state: EffectState<Event, Result, ErrorType>;

  start: () => void;
  next: (result: EffectResult<Event, Result>) => void;
  complete: () => void;
  error: (error: EffectError<Event, ErrorType>) => void;
}>;

const increaseCount = (count: number): number => count + 1;
const decreaseCount = (count: number): number => (count > 0 ? count - 1 : 0);

export function createEffectController<
  Event,
  Result,
  ErrorType = Error,
>(): EffectController<Event, Result, ErrorType> {
  const scope = createScope();

  const done = scope.action<EffectResult<Event, Result>>();
  const result = scope.action<Result>();
  const error = scope.action<EffectError<Event, ErrorType>>();
  const final = scope.action<EffectNotification<Event, Result, ErrorType>>();
  const pendingCount = scope.atom(0);

  return {
    state: {
      done,
      result,
      error,
      final,
      pending: compute(() => pendingCount() > 0),
      pendingCount: pendingCount.asReadonly(),
    },

    start: () => pendingCount.update(increaseCount),

    next: (entry) => {
      result(entry.result);
      done(entry);
      final({ type: 'result', ...entry });
    },

    complete: () => pendingCount.update(decreaseCount),

    error: (effectError) => {
      if (effectError.origin === 'handler') {
        pendingCount.update(decreaseCount);
      }

      if (isActionObserved(error) || isActionObserved(final)) {
        error(effectError);
        final({ type: 'error', ...effectError });
      } else {
        emitGlobalUnhandledError(effectError);
      }
    },

    destroy: () => scope.destroy(),
  };
}
