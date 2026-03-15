# Data Loading Through a Service

## Task

Load remote data through a service and keep loading, data, and error state
inside a view model.

## Solution

Inject or otherwise provide a service, keep request-related state in atoms, and
perform the async workflow in a view-model action.

## Code

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

type User = { id: string; name: string };
type UserService = { loadUser(id: string): Promise<User> };

export const UserScreenViewModel = (
  userService: UserService,
  userId: string,
) =>
  declareViewModel(({ scope }) => {
    const loading = scope.atom(false);
    const user = scope.atom<User | null>(null);
    const error = scope.atom<string | null>(null);

    return {
      state: {
        loading: readonlyAtom(loading),
        user: readonlyAtom(user),
        error: readonlyAtom(error),
      },
      load: async () => {
        loading.set(true);
        error.set(null);

        try {
          user.set(await userService.loadUser(userId));
        } catch (reason) {
          error.set(String(reason));
        } finally {
          loading.set(false);
        }
      },
    };
  });
```

```tsx
import React, { useEffect } from 'react';
import { useAtoms, withViewModel } from '@nrgyjs/react';

const UserScreen = withViewModel(UserScreenViewModel)(({ viewModel }) => {
  const { loading, user, error } = useAtoms(viewModel.state);

  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <div>{user?.name ?? 'No user'}</div>;
});
```

## What to Watch Out For

- keep request state close to the view model that owns the screen flow
- clear previous error state before starting a new request when appropriate
- expose readonly state to the view and keep async work in actions

## Common Mistakes

- calling services directly from the view
- mixing transport details into UI rendering code
- forgetting to model loading and error state explicitly
