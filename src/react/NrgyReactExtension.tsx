import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

import { ExtensionParamsProvider } from '../core/mvc/_public';

type NrgyReactExtensionContextType = ReadonlyArray<ExtensionParamsProvider>;

const NrgyReactExtensionContext = createContext<NrgyReactExtensionContextType>(
  [],
);

export function useNrgyReactExtensionContext(): NrgyReactExtensionContextType {
  return useContext(NrgyReactExtensionContext);
}

export const NrgyReactExtension: FC<
  PropsWithChildren & { provider: ExtensionParamsProvider }
> = ({ children, provider }) => {
  const parentProviders = useContext(NrgyReactExtensionContext);

  const [nextProviders] = useState(() => [...parentProviders, provider]);

  return (
    <NrgyReactExtensionContext.Provider value={nextProviders}>
      {children}
    </NrgyReactExtensionContext.Provider>
  );
};
