import * as REF_CORE from 'nrgy-reference';
import { Bench } from 'tinybench';

import * as DEV_CORE from '../dist';

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
    return createReferenceComputeTest(REF_CORE, { sync: true });
  });

  bench.add('REF: compute + effect    ', () => {
    return createReferenceComputeTest(REF_CORE, { sync: false });
  });

  await bench.run();

  console.table(bench.table());
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

  const fx = core.effect(
    h,
    () => {
      if (i < ITERATION_COUNT) {
        entry.set(++i);
      } else {
        latch.resolve();
      }
    },
    { sync },
  );

  return latch.promise.then(() => fx.destroy());
}

function createReferenceComputeTest(
  core: typeof REF_CORE,
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

  const fx = core.effect(
    h,
    () => {
      if (i < ITERATION_COUNT) {
        entry.set(++i);
      } else {
        latch.resolve();
      }
    },
    { sync },
  );

  return latch.promise.then(() => fx.destroy());
}

function createLatch<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  const result = {} as any;

  result.promise = new Promise<T>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}
