import { useEffect, useMemo } from 'react';

import { useDependencyContainer } from 'ditox-react';

import { Controller, ControllerFactory } from '../mvc/controller';

export function useInjectableController<Result extends Record<string, unknown>>(
  factory: ControllerFactory<Result>,
): Controller<Result> {
  const container = useDependencyContainer('strict');
  const controller = useMemo(() => factory(container), [container, factory]);

  useEffect(() => () => controller.destroy(), [controller]);

  return controller;
}
