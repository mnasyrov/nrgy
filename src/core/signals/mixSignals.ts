import { Signal } from '../common';
import { effect } from '../effect';

import { isSignal, signal } from './signal';
import { SignalOptions } from './types';

type MixSignalsSources<TValues extends unknown[]> = [
  ...{ [K in keyof TValues]: Signal<TValues[K]> },
];

/**
 * Mixes multiple signals into a single signal
 */
export function mixSignals<TValues extends unknown[]>(
  sources: MixSignalsSources<TValues>,
  options?: SignalOptions<TValues[number]>,
): Signal<TValues[number]> {
  type TResult = TValues[number];

  const resultSignal = signal<TResult>(options);

  for (const source of sources) {
    if (isSignal(source)) {
      effect(source, resultSignal, { sync: options?.sync });
    }
  }

  return resultSignal;
}
