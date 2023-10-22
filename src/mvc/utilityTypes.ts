import { ViewControllerFactory } from './declareViewController';

export type InferredService<Factory> = Factory extends ViewControllerFactory<
  infer Service,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer Params
>
  ? Service
  : never;
