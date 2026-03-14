# Очистка долгоживущего состояния

## Задача

Сделать так, чтобы long-lived state и ресурсы не оставались живыми после
завершения owning feature.

## Решение

Привязать cleanup к точкам destruction и явно очищать state, которое может
слишком долго оставаться достижимым.

## Код

```ts
import { compute, declareController, readonlyAtom } from '@nrgyjs/core';

export const SessionController = declareController(({ scope }) => {
  const cache = scope.atom<Map<string, string>>(new Map(), {
    onDestroy: () => {
      console.log('cache destroyed');
    },
  });

  scope.onDestroy(() => {
    cache.mutate((map) => {
      map.clear();
    });
  });

  const cacheSize = compute(() => cache().size);

  return {
    state: {
      cacheSize: readonlyAtom(cacheSize),
    },
    put: (key: string, value: string) => {
      cache.mutate((map) => {
        map.set(key, value);
      });
    },
  };
});
```

## На что обратить внимание

- у long-lived state должно быть явное ownership
- destruction может требовать и release ресурсов, и очистку значения
- timers, sockets и subscriptions тоже должны регистрироваться в cleanup
- для `Map` и похожих контейнеров часто лучше очищать данные in-place через
  `clear()`, а не заменять значение целиком
- если ресурс напрямую принадлежит atom, cleanup можно разместить и в его
  `onDestroy` callback

## Частые ошибки

- рассчитывать, что большой state исчезнет автоматически
- забывать очищать данные, которые остаются достижимыми через shared references
- освобождать только subscriptions, оставляя большие caches в памяти
