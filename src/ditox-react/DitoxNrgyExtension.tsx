import React, { FC, PropsWithChildren } from 'react';

import { useDependencyContainer } from 'ditox-react';

import { setDependencyContainerToParams } from '../ditox/withContainer';
import { ExtensionParamsProvider } from '../mvc';
import { NrgyControllerExtension } from '../mvc-react';

const DitoxInjectionParamsProvider: ExtensionParamsProvider = (params) => {
  const container = useDependencyContainer();
  setDependencyContainerToParams(params, container);
  return params;
};

/**
 * This extension binds a dependency container to view controllers and view-models.
 */
export const DitoxNrgyExtension: FC<PropsWithChildren> = ({ children }) => {
  return (
    <NrgyControllerExtension provider={DitoxInjectionParamsProvider}>
      {children}
    </NrgyControllerExtension>
  );
};
