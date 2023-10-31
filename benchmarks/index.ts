import * as REF_CORE from 'nrgy-reference';
import { Bench } from 'tinybench';

import * as DEV_CORE from '../dist/core';
import { createLatch } from '../src/utils/latch';

const ITERATION_COUNT = 200;

main();

async function main() {
  const bench = new Bench();

  bench.add('DEV: compute + syncEffect', () => {
    return createComputeTest(DEV_CORE, DEV_CORE.syncEffect);
  });

  bench.add('DEV: compute + effect    ', () => {
    return createComputeTest(DEV_CORE, DEV_CORE.effect);
  });

  bench.add('REF: compute + syncEffect', () => {
    return createComputeTest(REF_CORE, REF_CORE.effectSync);
  });

  bench.add('REF: compute + effect    ', () => {
    return createComputeTest(REF_CORE, REF_CORE.effect);
  });

  await bench.run();

  console.table(
    bench.table().sort((a, b) => (b?.Samples ?? 0) - (a?.Samples ?? 0)),
  );
}

function createComputeTest(
  core: typeof DEV_CORE | typeof REF_CORE,
  effectFactory: DEV_CORE.EffectFn,
) {
  const atom = (core as any).atom ?? (core as any).signal;
  const { compute } = core;

  const entry = atom(0);

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
