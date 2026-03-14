# Быстрый старт

## Назначение

Этот гайд показывает Nrgy.js через один маленький реактивный пример и один
маленький пример с контроллером.

## Ментальная модель

У Nrgy.js есть два основных слоя:

1. Реактивное ядро на базе `atom()`, `compute()` и `effect()`.
2. Слой контроллеров для выноса бизнес-логики из UI-компонентов.

Можно использовать только реактивный слой, а можно строить поверх него
контроллеры и view model.

## Первый реактивный пример

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const count = atom(0, { label: 'count' });
const doubled = compute(() => count() * 2, { label: 'doubled' });

const subscription = effect(doubled, (value) => {
  console.log('Doubled value:', value);
});

count.set(1);
count.set(2);

subscription.destroy();
```

Что здесь происходит:

- `atom()` создаёт изменяемое реактивное состояние.
- `compute()` выводит производное значение.
- `effect()` реагирует на изменения и умеет освобождаться.

## Первый пример контроллера

```ts
import { declareController, readonlyAtom } from '@nrgyjs/core';

export const CounterController = declareController(({ scope }) => {
  const count = scope.atom(0, { label: 'count' });

  return {
    state: {
      count: readonlyAtom(count),
    },
    increase: () => count.update((value) => value + 1),
    decrease: () => count.update((value) => value - 1),
  };
});

const controller = new CounterController();

controller.increase();
console.log(controller.state.count());

controller.destroy();
```

Что это добавляет:

- `scope` владеет ресурсами, созданными логикой контроллера.
- Контроллер наружу отдаёт контракт, а не UI-специфичное состояние.
- `destroy()` делает lifecycle явной частью API.

## Использование в React

```tsx
import React from 'react';
import { useAtom, useController } from '@nrgyjs/react';

function CounterScreen() {
  const controller = useController(CounterController);
  const count = useAtom(controller.state.count);

  return (
    <button onClick={controller.increase}>
      Count: {count}
    </button>
  );
}
```

## Рекомендуемый путь изучения

1. Освоить примитивы из [Core](./core/README.ru.md).
2. Понять [Архитектуру](./architecture/README.ru.md).
3. Перейти к [MVVM и Controllers](./mvvm/README.ru.md).
4. Для production-кода использовать [Интеграции](./integrations/README.ru.md)
   и [Рецепты](./recipes/README.ru.md).
