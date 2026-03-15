# Загрузка данных через service

## Задача

Загружать удалённые данные через service и держать loading, data и error state
внутри view model.

## Решение

Передать service через dependency или другой внешний вход, хранить состояние
запроса в atoms и выполнять асинхронный workflow внутри action view model.

## Код

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

## На что обратить внимание

- состояние запроса должно жить рядом с view model, которая владеет screen flow
- перед новым запросом обычно стоит очищать прошлый error state
- во view лучше отдавать readonly state, а async work держать в actions

## Частые ошибки

- вызывать services напрямую из view
- смешивать transport details с UI rendering code
- не моделировать loading и error state явно
