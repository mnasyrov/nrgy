import React, { FC, PropsWithChildren } from 'react';

import { useDependencyContainer } from 'ditox-react';

import { ExtensionParamsProvider } from '../core/mvc/_public';
import { setDependencyContainerToParams } from '../ditox/withInjections';
import { NrgyReactExtension } from '../react/_public';

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
