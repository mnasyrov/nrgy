import { Bench } from 'tinybench';

import { compute, effect, runEffects, signal } from '../src/core';

const ITERATION_COUNT = 100;

const bench = new Bench();

bench.add('compute', () => {
  const entry = signal(0);

  const a = compute(() => entry());
  const b = compute(() => a() + 1);
  const c = compute(() => a() + 1);
  const d = compute(() => b() + c());
  const e = compute(() => d() + 1);
  const f = compute(() => d() + e());
  const g = compute(() => d() + e());
  const h = compute(() => f() + g());

  effect(() => h());

  for (let i = 0; i < ITERATION_COUNT; i++) {
    entry.set(i);
    runEffects();
  }
});

async function main() {
  await bench.run();

  console.table(bench.table());
}

main();
