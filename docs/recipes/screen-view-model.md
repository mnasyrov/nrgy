# Screen ViewModel

## Task

Model one screen as a view model that owns screen-local state, derived values,
and user actions.

## Solution

Treat the screen as one feature boundary. Keep the screen state, loading flags,
derived values, and actions inside a view model instead of scattering them
across UI components.

## Code

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

export const ProfileScreenViewModel = declareViewModel(({ scope }) => {
  const tab = scope.atom<'info' | 'activity'>('info');
  const saving = scope.atom(false);

  return {
    state: {
      tab: readonlyAtom(tab),
      saving: readonlyAtom(saving),
    },
    openInfo: () => tab.set('info'),
    openActivity: () => tab.set('activity'),
    save: async () => {
      saving.set(true);

      try {
        // save screen data
      } finally {
        saving.set(false);
      }
    },
  };
});
```

```tsx
import { useAtoms, withViewModel } from '@nrgyjs/react';

const ProfileScreen = withViewModel(ProfileScreenViewModel)(({ viewModel }) => {
  const { tab, saving } = useAtoms(viewModel.state);

  return (
    <section>
      <button onClick={viewModel.openInfo}>Info</button>
      <button onClick={viewModel.openActivity}>Activity</button>
      <div>Current tab: {tab}</div>
      <button disabled={saving} onClick={() => void viewModel.save()}>
        Save
      </button>
    </section>
  );
});
```

## What to Watch Out For

- the view model should represent one coherent screen flow
- UI components should render state and forward intent, not own screen workflow
- screen lifecycle should define when the view model is destroyed

## Common Mistakes

- splitting one screen workflow across many unrelated component states
- calling services directly from leaf components
- keeping screen-level effects outside the screen owner
