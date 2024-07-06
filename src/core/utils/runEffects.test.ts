import { RUNTIME } from '../internals/runtime';

import { runEffects } from './runEffects';

describe('runEffects()', () => {
  it('should runs all effects which are scheduled for the next microtask', () => {
    const spy = jest.fn();

    RUNTIME.asyncScheduler.schedule(() => spy());
    expect(spy).toHaveBeenCalledTimes(0);

    runEffects();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
