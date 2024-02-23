import React, { FC } from 'react';

import { render } from '@testing-library/react';

import { ExtensionParamsProvider } from '../mvc';

import {
  NrgyControllerExtension,
  useNrgyControllerExtensionContext,
} from './NrgyControllerExtension';

describe('NrgyControllerExtension', () => {
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
      providers = useNrgyControllerExtensionContext();
      return null;
    };

    render(
      <NrgyControllerExtension provider={value1Provider}>
        <NrgyControllerExtension provider={value2Provider}>
          <TestComponent />
        </NrgyControllerExtension>
      </NrgyControllerExtension>,
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
