import { Bench } from 'tinybench';

import { computed, effect, signal } from '../src/core';
import { SIGNAL_RUNTIME } from '../src/core/runtime';
import { compute, createStore } from '../src/rx-effects';

const ITERATION_COUNT = 100;

const bench = new Bench();

bench.add('legacy compute', () => {
  const entry = createStore(0);

  const a = compute((get) => get(entry));
  const b = compute((get) => get(a) + 1);
  const c = compute((get) => get(a) + 1);
  const d = compute((get) => get(b) + get(c));
  const e = compute((get) => get(d) + 1);
  const f = compute((get) => get(d) + get(e));
  const g = compute((get) => get(d) + get(e));
  const h = compute((get) => get(f) + get(g));

  h.value$.subscribe();

  for (let i = 0; i < ITERATION_COUNT; i++) {
    entry.set(i);
    entry.notify();
  }
});

bench.add('signal computed', () => {
  const entry = signal(0);

  const a = computed(() => entry());
  const b = computed(() => a() + 1);
  const c = computed(() => a() + 1);
  const d = computed(() => b() + c());
  const e = computed(() => d() + 1);
  const f = computed(() => d() + e());
  const g = computed(() => d() + e());
  const h = computed(() => f() + g());

  effect(() => h());

  for (let i = 0; i < ITERATION_COUNT; i++) {
    entry.set(i);
    SIGNAL_RUNTIME.asyncScheduler.execute();
  }
});

async function main() {
  await bench.run();

  console.table(bench.table());
}

main();
