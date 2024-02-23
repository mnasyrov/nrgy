import React, { FC, PropsWithChildren } from 'react';

import { useDependencyContainer } from 'ditox-react';

import { setDependencyContainerToParams } from '../ditox/withInjections';
import { ExtensionParamsProvider } from '../mvc';
import { NrgyReactExtension } from '../react';

const DitoxInjectionParamsProvider: ExtensionParamsProvider = (params) => {
  const container = useDependencyContainer();
  setDependencyContainerToParams(params, container);
  return params;
};

export const DitoxNrgyReactExtension: FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <NrgyReactExtension provider={DitoxInjectionParamsProvider}>
      {children}
    </NrgyReactExtension>
  );
};
