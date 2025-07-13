import { defer, finalize, MonoTypeOperatorFunction, noop } from 'rxjs';

export function monitorSubscriptionCount<T>(
  onCountUpdate: (count: number) => void = noop,
): MonoTypeOperatorFunction<T> {
  return (source$) => {
    let counter = 0;

    return defer(() => {
      counter += 1;
      onCountUpdate(counter);
      return source$;
    }).pipe(
      finalize(() => {
        counter -= 1;
        onCountUpdate(counter);
      }),
    );
  };
}
