# Shared State Between Screens

## Task

Share business state between several screens through a dedicated business
controller, while UI components consume separate view models.

## Solution

Publish one business controller in the DI container, then let screen-specific
view models inject that controller and adapt its state and actions for the UI.
The business controller should be created and registered in the application
composition root, not inside one of the screens.

## Code

```ts
import { declareController, declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { withInjections } from '@nrgyjs/ditox';
import { token } from 'ditox';

const WORKSPACE_SELECTION = token<{
  state: { selectedWorkspaceId: () => string | null };
  selectWorkspace(id: string): void;
}>();

export const WorkspaceSelectionController = declareController(({ scope }) => {
  const selectedWorkspaceId = scope.atom<string | null>(null);

  return {
    state: {
      selectedWorkspaceId: readonlyAtom(selectedWorkspaceId),
    },
    selectWorkspace: (id: string) => selectedWorkspaceId.set(id),
  };
});

export const WorkspaceHeaderViewModel = declareViewModel()
  .extend(withInjections({ workspaceSelection: WORKSPACE_SELECTION }))
  .apply(({ deps }) => ({
    state: {
      selectedWorkspaceId: deps.workspaceSelection.state.selectedWorkspaceId,
    },
    selectWorkspace: deps.workspaceSelection.selectWorkspace,
  }));

export const WorkspaceDetailsViewModel = declareViewModel()
  .extend(withInjections({ workspaceSelection: WORKSPACE_SELECTION }))
  .apply(({ deps }) => ({
    state: {
      selectedWorkspaceId: deps.workspaceSelection.state.selectedWorkspaceId,
    },
  }));
```

```ts
// app composition root
container.bind(
  WORKSPACE_SELECTION,
  applyInjections(WorkspaceSelectionController),
);
```

## What to Watch Out For

- the shared business layer should have one clear owner
- long-lived shared controllers should be connected at the app or feature
  composition root
- UI-specific view models should adapt shared business state instead of
  reimplementing it
- not every cross-screen value should become a shared business dependency

## Common Mistakes

- turning all application state into one global store
- hiding the business owner of shared state
- putting view-specific logic into the shared business controller
- constructing the shared business controller independently inside each screen
