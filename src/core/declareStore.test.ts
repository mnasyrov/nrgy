import { declareStore } from './declareStore';
import { declareStateUpdates } from './store';

describe('declareStore() #1', () => {
  const COUNTER_UPDATES = declareStateUpdates<number>()({
    increase: () => (state) => state + 1,
    decrease: () => (state) => state - 1,
  });

  it('should declare a store with updates', () => {
    const createStore = declareStore({
      options: { name: 'counterStore' },
      initialState: 0,
      updates: COUNTER_UPDATES,
    });

    const store = createStore();
    expect(store()).toBe(0);

    store.updates.increase();
    expect(store()).toBe(1);

    store.updates.decrease();
    expect(store()).toBe(0);
  });

  it('should return a factory which can override initial parameters', () => {
    const createStore = declareStore({
      options: { name: 'counterStore' },
      initialState: 0,
      updates: COUNTER_UPDATES,
    });

    const store = createStore(10);

    store.updates.increase();
    expect(store()).toBe(11);

    store.updates.decrease();
    expect(store()).toBe(10);
  });

  it('should work with a discriminate type of a state', () => {
    type State = { status: 'success' } | { status: 'error'; error: string };

    const initialState: State = { status: 'success' };

    const stateUpdates = declareStateUpdates<State>()({
      setSuccess: () => () => ({ status: 'success' }),
      setError: (error: string) => () => ({ status: 'error', error: error }),
    });

    const createStore = declareStore<State, typeof stateUpdates>({
      initialState,
      updates: stateUpdates,
    });

    const store = createStore();
    expect(store()).toEqual({ status: 'success' });

    store.updates.setError('fail');
    expect(store()).toEqual({ status: 'error', error: 'fail' });

    store.updates.setSuccess();
    expect(store()).toEqual({ status: 'success' });
  });
});

describe('declareStore() #2', () => {
  type SimpleState = {
    value: string;
    count: number;
  };
  const initialState: SimpleState = {
    value: 'initial text',
    count: 0,
  };
  const createSimpleStore = declareStore({
    initialState,
    updates: {
      set: (value: number) => (state) => {
        return {
          ...state,
          count: value,
        };
      },
      sum: (value1: number, value2: number) => (state) => {
        return {
          ...state,
          count: value1 + value2,
        };
      },
      increment: () => (state) => {
        return {
          ...state,
          count: state.count + 1,
        };
      },
      decrement: () => (state) => {
        return {
          ...state,
          count: state.count - 1,
        };
      },
    },
  });

  it('should allow testing of updates', () => {
    expect(initialState.count).toBe(0);

    const result = createSimpleStore.updates.set(10)(initialState);

    expect(result.count).toBe(10);
  });

  it('should executing without mutation for initial state', () => {
    createSimpleStore.updates.set(10)(initialState);

    expect(initialState.count).toBe(0);
  });

  it('should update initial state during initialization', () => {
    const simpleStore = createSimpleStore({
      count: 12,
      value: 'new initial text',
    });

    expect(simpleStore().count).toBe(12);

    expect(simpleStore().value).toBe('new initial text');
  });

  it('should initial state to be able to be a function', () => {
    const simpleStore = createSimpleStore((state) => ({
      ...state,
      value: 'updated text',
    }));

    expect(simpleStore().count).toBe(0);

    expect(simpleStore().value).toBe('updated text');
  });

  it('should update the state', () => {
    const simpleStore = createSimpleStore();
    expect(simpleStore().count).toBe(0);

    simpleStore.updates.set(10);

    expect(simpleStore().count).toBe(10);

    simpleStore.updates.increment();

    expect(simpleStore().count).toBe(11);

    simpleStore.updates.decrement();
    simpleStore.updates.decrement();

    expect(simpleStore().count).toBe(9);
  });

  it('should execute query selector', () => {
    const simpleStore = createSimpleStore();

    simpleStore.updates.set(1);

    expect(simpleStore().count).toBe(1);
  });

  it('should use a lot of arguments in updates', () => {
    const simpleStore = createSimpleStore();

    simpleStore.updates.sum(1, 11);

    expect(simpleStore().count).toBe(12);
  });
});
