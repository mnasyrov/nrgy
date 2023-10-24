import { flushMicrotasks } from '../test/testUtils';

import { action } from './action';
import { effect } from './effect';

describe('action', () => {
  it('should emit the event', async () => {
    const a = action<number>();

    let result;
    effect(a, (value) => (result = value));
    a(1);

    await flushMicrotasks();
    expect(result).toBe(1);
  });

  it('should use void type and undefined value if a generic type is not specified', async () => {
    const a = action();

    let count = 0;
    effect(a, () => count++);
    a();

    await flushMicrotasks();
    expect(count).toBe(1);
  });
});
