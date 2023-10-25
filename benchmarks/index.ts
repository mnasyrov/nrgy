import { Bench } from 'tinybench';

import { compute, effect, effectSync, signal } from '../src/core';
import { createLatch } from '../src/utils/latch';

const ITERATION_COUNT = 200;

function createTestGraph() {
  const entry = signal(0);

  const a = compute(() => entry());
  const b = compute(() => a() + 1);
  const c = compute(() => a() + 1);
  const d = compute(() => b() + c());
  const e = compute(() => d() + 1);
  const f = compute(() => d() + e());
  const g = compute(() => d() + e());
  const h = compute(() => f() + g());

  return { entry, h };
}

const bench = new Bench();

bench.add('compute sync', () => {
  const { entry, h } = createTestGraph();
  const latch = createLatch();

  let i = 0;

  effectSync(() => {
    h();

    if (i < ITERATION_COUNT) {
      entry.set(++i);
    } else {
      latch.resolve();
    }
  });

  return latch.promise;
});

bench.add('compute async', () => {
  const { entry, h } = createTestGraph();
  const latch = createLatch();

  let i = 0;

  effect(() => {
    h();

    if (i < ITERATION_COUNT) {
      entry.set(++i);
    } else {
      latch.resolve();
    }
  });

  return latch.promise;
});

async function main() {
  await bench.run();

  console.table(bench.table());
}

main();
