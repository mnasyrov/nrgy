import * as REF_CORE from 'nrgy-reference';
import { Bench } from 'tinybench';

import * as DEV_CORE from '../dist/core';
import { createLatch } from '../src/utils/latch';

const ITERATION_COUNT = 200;

main();

async function main() {
  const bench = new Bench();

  bench.add('DEV: compute + effectSync', () => {
    return createComputeTest(DEV_CORE, true);
  });

  bench.add('DEV: compute + effect    ', () => {
    return createComputeTest(DEV_CORE, false);
  });

  bench.add('REF: compute + effectSync', () => {
    return createComputeTest(REF_CORE, true);
  });

  bench.add('REF: compute + effect    ', () => {
    return createComputeTest(REF_CORE, false);
  });

  await bench.run();

  console.table(
    bench.table().sort((a, b) => (b?.Samples ?? 0) - (a?.Samples ?? 0)),
  );
}

function createComputeTest(
  core: typeof DEV_CORE | typeof REF_CORE,
  sync: boolean,
) {
  const { signal, compute } = core;
  const effectFactory = sync ? core.effectSync : core.effect;

  const entry = signal(0);

  const a = compute(() => entry());
  const b = compute(() => a() + 1);
  const c = compute(() => a() + 1);
  const d = compute(() => b() + c());
  const e = compute(() => d() + 1);
  const f = compute(() => d() + e());
  const g = compute(() => d() + e());
  const h = compute(() => f() + g());

  const latch = createLatch();

  let i = 0;

  effectFactory(() => {
    h();

    if (i < ITERATION_COUNT) {
      entry.set(++i);
    } else {
      latch.resolve();
    }
  });

  return latch.promise;
}
