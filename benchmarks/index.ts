import * as REF_CORE from 'nrgy-reference';
import { Bench } from 'tinybench';

import * as DEV_CORE from '../dist';
import { createLatch } from '../src/core/utils/latch';

const ITERATION_COUNT = 200;

main();

async function main() {
  const bench = new Bench();

  bench.add('DEV: compute + syncEffect', () => {
    return createDevComputeTest(DEV_CORE, { sync: true });
  });

  bench.add('DEV: compute + effect    ', () => {
    return createDevComputeTest(DEV_CORE, { sync: false });
  });

  bench.add('REF: compute + syncEffect', () => {
    return createReferenceComputeTest(REF_CORE, REF_CORE.effectSync);
  });

  bench.add('REF: compute + effect    ', () => {
    return createReferenceComputeTest(REF_CORE, REF_CORE.effect);
  });

  await bench.run();

  console.table(
    bench.table().sort((a, b) => (b?.Samples ?? 0) - (a?.Samples ?? 0)),
  );
}

function createDevComputeTest(
  core: typeof DEV_CORE,
  params: { sync: boolean },
) {
  const { sync } = params;
  const atom = core.atom;

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

  DEV_CORE.effect(
    () => {
      h();

      if (i < ITERATION_COUNT) {
        entry.set(++i);
      } else {
        latch.resolve();
      }
    },
    { sync },
  );

  return latch.promise;
}

function createReferenceComputeTest(core: typeof REF_CORE, effectFactory: any) {
  const atom = core.signal;
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
