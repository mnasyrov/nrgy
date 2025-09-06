import * as REF_CORE from 'nrgy-reference';
import { Bench } from 'tinybench';

import * as DEV_CORE from '../dist/index.js';

const ITERATION_COUNT = 200;

main();

async function main() {
  const bench = new Bench();

  bench.add(
    'avoidablePropagation (syncEffect)',
    avoidablePropagation(DEV_CORE),
  );

  // bench.add('REF: avoidablePropagation', avoidablePropagation(REF_CORE));

  bench.add('compute (syncEffect)', () => {
    return createDevComputeTest(DEV_CORE, { sync: true });
  });

  // bench.add('REF: compute + syncEffect', () => {
  //   return createReferenceComputeTest(REF_CORE, { sync: true });
  // });

  bench.add('compute (async effect)    ', () => {
    return createDevComputeTest(DEV_CORE, { sync: false });
  });

  // bench.add('REF: compute + effect    ', () => {
  //   return createReferenceComputeTest(REF_CORE, { sync: false });
  // });

  await bench.run();

  console.table(bench.table());
}

function createDevComputeTest(core, params) {
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

function createReferenceComputeTest(core, params) {
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

function createLatch() {
  const result = {};

  result.promise = new Promise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}

// heavy computation
function busy() {
  let a = 0;
  for (let i = 0; i < 1_00; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    a++;
  }
}

/** avoidable change propagation  */
export function avoidablePropagation(core) {
  const { atom, compute, syncEffect, batch } = core;

  let head = atom(0);
  let computed1 = compute(() => head());
  let computed2 = compute(() => (computed1(), 0));
  let computed3 = compute(() => (busy(), computed2() + 1)); // heavy computation
  let computed4 = compute(() => computed3() + 2);
  let computed5 = compute(() => computed4() + 3);

  syncEffect(computed5, () => {
    busy(); // heavy side effect
  });

  return () => {
    batch(() => head.set(1));
    console.assert(computed5() === 6);

    for (let i = 0; i < 1000; i++) {
      batch(() => head.set(i));

      console.assert(computed5() === 6);
    }
  };
}
