# ViewModel для экрана

## Задача

Смоделировать один экран как view model, которая владеет screen-local state,
derived values и пользовательскими actions.

## Решение

Рассматривать экран как одну feature boundary. Хранить состояние экрана,
loading flags, derived values и actions внутри view model, а не размазывать их
по UI-компонентам.

## Код

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

## На что обратить внимание

- view model должна представлять один связный screen flow
- UI-компоненты должны рендерить state и передавать intent, а не владеть
  screen workflow
- lifecycle экрана должен определять момент уничтожения view model

## Частые ошибки

- дробить один screen workflow на множество несвязанных component states
- вызывать services напрямую из leaf-компонентов
- держать screen-level effects вне screen owner
