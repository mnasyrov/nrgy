import { Atom } from '../common';

export type BaseViewModel = {
  state: Record<string, Atom<unknown>>;
};

export type ViewModel<T extends BaseViewModel> = T;
