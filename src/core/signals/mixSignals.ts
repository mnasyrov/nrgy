import { Signal } from '../common';
import { effect } from '../effects/effect';
import { EffectSubscription } from '../effects/types';
import { ListItem } from '../utils/list';

import { signal } from './signal';
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
  type SubscriptionList = ListItem<{ subscription: EffectSubscription<any> }>;

  let subscriptionList: undefined | SubscriptionList;

  function subscribeSources() {
    if (subscriptionList === undefined) {
      for (const source of sources) {
        const fx = effect(source, resultSignal, { sync: options?.sync });
        subscriptionList = { subscription: fx, next: subscriptionList };
      }
    }
  }

  function unsubscribeSources() {
    for (let item = subscriptionList; item; item = item.next) {
      item.subscription.destroy();
    }

    subscriptionList = undefined;
  }

  const resultSignal = signal<TResult>({
    ...options,

    onSubscribe: () => {
      subscribeSources();

      options?.onSubscribe?.();
    },

    onUnsubscribe: (isEmpty) => {
      if (isEmpty) {
        unsubscribeSources();
      }

      options?.onUnsubscribe?.(isEmpty);
    },

    onDestroy: () => {
      unsubscribeSources();

      options?.onDestroy?.();
    },
  });

  return resultSignal;
}
