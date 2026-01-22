import { atom, effect } from '../reactivity/reactivity';

import { runEffects } from './runEffects';

describe('runEffects()', () => {
  it('should runs all effects which are scheduled for the next microtask', () => {
    const spy = jest.fn();

    const source = atom(1);
    effect(source, spy);

    expect(spy).toHaveBeenCalledTimes(0);

    runEffects();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
