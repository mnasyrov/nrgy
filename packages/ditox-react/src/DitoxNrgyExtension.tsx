import { type ExtensionParamsProvider } from '@nrgyjs/core';
import { provideDependencyContainer } from '@nrgyjs/ditox';
import { NrgyControllerExtension } from '@nrgyjs/react';
import { useDependencyContainer } from 'ditox-react';
import React, { type FC, type PropsWithChildren } from 'react';

const DitoxInjectionParamsProvider: ExtensionParamsProvider = (params) => {
  const container = useDependencyContainer();
  provideDependencyContainer(container)(params);
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
