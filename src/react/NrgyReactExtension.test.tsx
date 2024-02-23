import React, { FC } from 'react';

import { render } from '@testing-library/react';

import { ExtensionParamsProvider } from '../mvc';

import {
  NrgyReactExtension,
  useNrgyReactExtensionContext,
} from './NrgyReactExtension';

describe('NrgyReactExtension', () => {
  it('should provide a value to the extension context', () => {
    const value1Provider: ExtensionParamsProvider = (params) => ({
      ...params,
      test1: 'value1',
    });
    const value2Provider: ExtensionParamsProvider = (params) => ({
      ...params,
      test2: 'value2',
    });

    let providers: undefined | ReadonlyArray<ExtensionParamsProvider>;

    const TestComponent: FC = () => {
      providers = useNrgyReactExtensionContext();
      return null;
    };

    render(
      <NrgyReactExtension provider={value1Provider}>
        <NrgyReactExtension provider={value2Provider}>
          <TestComponent />
        </NrgyReactExtension>
      </NrgyReactExtension>,
    );

    expect(providers).toEqual([value1Provider, value2Provider]);

    const extensionParams = providers?.reduce(
      (params, provider) => provider(params),
      {},
    );
    expect(extensionParams).toEqual({
      test1: 'value1',
      test2: 'value2',
    });
  });
});
