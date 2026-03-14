# DI in a ViewModel

## Task

Use infrastructure services inside a view model without hardcoding them into UI
or global modules.

## Solution

Inject services through the DI integration layer and consume them inside view
model actions.

## Code

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { withInjections } from '@nrgyjs/ditox';
import { token } from 'ditox';

const USER_API = token<{ loadName(): Promise<string> }>();

export const UserNameViewModel = declareViewModel()
  .extend(withInjections({ userApi: USER_API }))
  .apply(({ scope, deps }) => {
    const loading = scope.atom(false);
    const name = scope.atom<string | null>(null);

    return {
      state: {
        loading: readonlyAtom(loading),
        name: readonlyAtom(name),
      },
      load: async () => {
        loading.set(true);

        try {
          name.set(await deps.userApi.loadName());
        } finally {
          loading.set(false);
        }
      },
    };
  });
```

```tsx
import { useAtoms, withViewModel } from '@nrgyjs/react';

const UserNameCard = withViewModel(UserNameViewModel)(({ viewModel }) => {
  const { loading, name } = useAtoms(viewModel.state);

  return (
    <section>
      <button disabled={loading} onClick={() => void viewModel.load()}>
        Load user
      </button>
      <div>{name ?? 'Unknown user'}</div>
    </section>
  );
});
```

## What to Watch Out For

- inject infrastructure dependencies, not feature params
- keep DI wiring outside UI components
- expose only view-facing state and actions from the view model

## Common Mistakes

- using DI for values that should be explicit feature inputs
- importing infrastructure singletons directly into the view
- leaking container details into UI-facing contracts
