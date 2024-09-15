export type AnyObject = Record<string, any>;

export type AnyFunction = (...args: any[]) => any;

export type DataRef<T> = {
  value: T | undefined;
};
