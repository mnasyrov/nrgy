# DI во ViewModel

## Задача

Использовать инфраструктурные services внутри view model, не хардкодя их в UI
или глобальные модули.

## Решение

Инжектить services через слой DI-интеграции и использовать их внутри actions
view model.

## Код

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

## На что обратить внимание

- инжектить нужно инфраструктурные зависимости, а не feature params
- DI wiring не должно жить внутри UI-компонентов
- view model должна отдавать наружу только view-facing state и actions

## Частые ошибки

- использовать DI для значений, которые должны быть явными feature inputs
- импортировать инфраструктурные singleton-объекты напрямую во view
- протаскивать container details в UI-facing contracts
