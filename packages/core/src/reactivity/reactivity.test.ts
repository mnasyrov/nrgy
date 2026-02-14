import { describe, expect, test } from 'vitest';
import { atom, compute, syncEffect } from './reactivity';

describe('Reactivity tests', () => {
  test('Computed expression: y = x+1', () => {
    const x = atom(0);
    const y = compute(() => x() + 1);

    const results: number[] = [];
    syncEffect(y, (value) => results.push(value));

    x.set(1);
    x.set(2);

    expect(results).toEqual([1, 2, 3]);
  });

  test('Computed expression: y = (x+1) + (x*10)', () => {
    const x = atom(0);
    const a = compute(() => x() + 1);
    const b = compute(() => x() * 10);
    const y = compute(() => a() + b());

    const results: number[] = [];
    syncEffect(y, (value) => results.push(value));

    x.set(1);
    x.set(2);

    expect(results).toEqual([1, 12, 23]);
  });

  test('Computed expression: y = ((x+1) * 10) + (x+2)', () => {
    const x = atom(0);
    const a = compute(() => x() + 1); // a = x+1
    const b = compute(() => a() * 10); // b = a*10
    const c = compute(() => x() + 2); // c = x+2
    const y = compute(() => b() + c());

    const results: number[] = [];
    syncEffect(y, (value) => results.push(value));

    x.set(1);
    x.set(2);

    expect(results).toEqual([12, 23, 34]);
  });

  test('Computed expression: y = (x+2) + ((x+1) * 10)', () => {
    const x = atom(0);
    const a = compute(() => x() + 2); // a = x+2
    const b = compute(() => x() + 1); // b = x+1
    const c = compute(() => b() * 10); // c = b*10
    const y = compute(() => a() + c());

    const results: number[] = [];
    syncEffect(y, (value) => results.push(value));

    x.set(1);
    x.set(2);

    expect(results).toEqual([12, 23, 34]);
  });

  test('Computed expression: y = x + (x*10)', () => {
    const x = atom(0);
    const a = compute(() => x() * 10); // a = x*10
    const y = compute(() => x() + a());

    const results: number[] = [];
    syncEffect(y, (value) => results.push(value));

    x.set(1);
    x.set(2);

    expect(results).toEqual([0, 11, 22]);
  });

  test('Triangle test, width=3, y=x+(x+1)+(x+2)', () => {
    const x = atom(0, { label: 'x' });
    const a = compute(() => x() + 1, { label: 'a' });
    const b = compute(() => a() + 1, { label: 'b' });
    const y = compute(() => x() + a() + b(), { label: 'y' });

    // const results: number[] = [];
    // syncEffect(y, (value) => results.push(value));

    expect(y()).toBe(3);

    x.set(1);
    expect(y()).toBe(6);

    x.set(0);
    expect(y()).toBe(3);

    x.set(1);
    expect(y()).toBe(6);

    x.set(2);
    expect(y()).toBe(9);

    // expect(results).toEqual([3, 6, 3, 6, 9]);
  });
});
