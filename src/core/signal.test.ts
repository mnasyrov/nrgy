import { flushMicrotasks } from '../test/testUtils';

import { effect } from './effect';
import { signal } from './signal';

describe('signal()', () => {
  it('should return an event emitter', async () => {
    const a = signal<number>();

    let result;
    effect(a, (value) => (result = value));
    a(1);

    await flushMicrotasks();
    expect(result).toBe(1);
  });

  it('should use void type and undefined value if a generic type is not specified', async () => {
    const a = signal();

    let count = 0;
    effect(a, () => count++);
    a();

    await flushMicrotasks();
    expect(count).toBe(1);
  });
});
