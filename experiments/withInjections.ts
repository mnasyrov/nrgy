// const controllerFactory = declareViewController2.extend(
//   withInjections({ value: VALUE_TOKEN }),
//   withViewProps<{ factor: number }>(),
//   withViewLifecycle(),
// )(({ scope, props }) => {

import { Token } from 'ditox';
import {ContextExtendFn, ControllerContext} from './declareController2';

export declare type DependencyProps = {
  [key: string]: unknown;
};

export declare type TokenProps<Props extends DependencyProps> = {
  [K in keyof Props]: Token<Props[K]>;
};

export function withInjections<Dependencies extends DependencyProps>(
  tokens: TokenProps<Dependencies>,
): ContextExtendFn<T extends ControllerContext, R extends T & {deps: Dependencies}> {



}
