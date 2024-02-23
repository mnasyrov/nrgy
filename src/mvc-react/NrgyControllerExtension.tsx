import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { ExtensionParamsProvider } from '../mvc';

type NrgyControllerExtensionContextType =
  ReadonlyArray<ExtensionParamsProvider>;

const NrgyControllerExtensionContext =
  createContext<NrgyControllerExtensionContextType>([]);

export function useNrgyControllerExtensionContext(): NrgyControllerExtensionContextType {
  return useContext(NrgyControllerExtensionContext);
}

export const NrgyControllerExtension: FC<
  PropsWithChildren<{ provider: ExtensionParamsProvider }>
> = ({ children, provider }) => {
  const parentProviders = useContext(NrgyControllerExtensionContext);

  const [nextProviders] = useState(() => [...parentProviders, provider]);

  return (
    <NrgyControllerExtensionContext.Provider value={nextProviders}>
      {children}
    </NrgyControllerExtensionContext.Provider>
  );
};
