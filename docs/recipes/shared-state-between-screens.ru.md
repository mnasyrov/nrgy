# Общее состояние между экранами

## Задача

Разделять бизнес-состояние между несколькими экранами через выделенный
бизнес-контроллер, а UI-компоненты строить на отдельных view model.

## Решение

Опубликовать один business controller в DI container, а затем строить
screen-specific view model, которые инжектят этот контроллер и адаптируют его
state и actions для UI.
Сам business controller должен создаваться и публиковаться в application
composition root, а не внутри одного из экранов.

## Код

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

## На что обратить внимание

- у общего business layer должен быть один понятный владелец
- long-lived shared controllers должны подключаться на app или feature
  composition root
- UI-specific view model должны адаптировать общее business state, а не
  переизобретать его
- не каждое значение между экранами должно становиться общей business
  зависимостью

## Частые ошибки

- превращать всё состояние приложения в один глобальный store
- скрывать business owner у shared state
- класть view-specific логику в общий business controller
- независимо создавать общий business controller внутри каждого экрана
