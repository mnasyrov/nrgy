# Стиль кодирования

## Назначение

Этот гайд фиксирует паттерны конкретно этого проекта, которые повторяются
во всей кодовой базе Nrgy.js. Общие правила TypeScript и форматирования
обеспечиваются `tsconfig` и Biome — здесь они не дублируются.

Правила документации — в
[docs_requirements.ru.md](./docs_requirements.ru.md).

## Форматирование и язык

- Форматирование делает Biome — запускайте `npm run format`. Не правьте
  пробелы вручную.
- TypeScript работает в режиме `strict`. Тайпчек — `npm run check`.
- Для публичного API используйте named exports.

## Паттерн: жизненный цикл через `Scope`

Всё, что владеет ресурсом (atom, effect, подписка, дочерний контроллер),
должно крепиться к `Scope`. `destroy()` у скоупа — единая точка teardown.
Не изобретайте свои массивы очистки или булевые флаги.

```ts
import { createScope } from '@nrgyjs/core';

const scope = createScope();

const value = scope.atom(0);                 // зарегистрирован для disposal
scope.effect(value, (v) => console.log(v));  // отписывается на destroy
scope.onDestroy(() => closeSocket(socket));  // произвольный teardown

scope.destroy();                             // освобождает всё выше
```

- `scope.atom`, `scope.effect`, `scope.syncEffect` создают и регистрируют
  ресурс одновременно. Предпочитайте их паре «`atom(...)` + ручная чистка».
- `scope.add(resource)` принимает существующий `{ unsubscribe }` /
  `{ destroy }` / `Scope`.
- `destroy()` идемпотентен — двойной вызов не ошибка.

## Паттерн: контроллеры через `declareController`

Бизнес-логика живёт в контроллерах. Декларация контроллера получает контекст
(`{ scope, params }`) и возвращает публичный сервис. Возвращаемый `destroy()`
подставляется автоматически из scope, если вы его явно не переопределяете.

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController<{ value: () => number }>(
  ({ scope }) => {
    const value = scope.atom(0);

    return {
      value,
      increase: () => value.update((prev) => prev + 1),
    };
  },
);

const counter = new CounterController();
counter.increase();
counter.destroy();
```

- Всё реактивное состояние создавайте через `scope` контроллера, чтобы оно
  гасилось вместе с контроллером.
- Не возвращайте из контроллера сырые мутируемые объекты — отдавайте атомы
  (для чтения) и методы (для записи).
- Публичная поверхность — это возвращаемый сервис плюс автоматический
  `destroy()`. Не добавляйте отдельный `dispose()` или `close()`.

## Паттерн: `@nrgyjs/core` остаётся framework-agnostic

`@nrgyjs/core` не должен зависеть от React, RxJS, DOM или любого другого
рантайма. Интеграции с фреймворками живут в `@nrgyjs/react`, `@nrgyjs/rxjs`,
`@nrgyjs/rx-effects` и пакетах `ditox`.

- Новая абстракция, которой нужен `window`, JSX или `Observable`, должна
  попасть в соответствующий интеграционный пакет, а не в core.
- Если фичу можно выразить через atoms, effects и scopes — её место в core.
  Если нужны фреймворковые жизненные циклы — нет.

## Паттерн: тесты по наблюдаемому поведению

Тесты пишутся на Vitest, лежат рядом с исходниками
(`foo.ts` ↔ `foo.test.ts`) и проверяют наблюдаемое снаружи поведение.
Обязательно покрывайте сценарии разрушения — баги lifecycle не всплывают
на happy-path.

```ts
import { describe, expect, it, vi } from 'vitest';
import { createScope } from './createScope';
import { atom } from '../reactivity/reactivity';

describe('createScope()', () => {
  it('disposes collected atoms on destroy', () => {
    const scope = createScope();
    const value = scope.add(atom(1));

    scope.destroy();
    value.set(2);

    expect(value()).toBe(1); // запись после destroy — no-op
  });

  it('runs registered teardown exactly once', () => {
    const scope = createScope();
    const teardown = vi.fn();

    scope.onDestroy(teardown);
    scope.destroy();
    scope.destroy(); // идемпотентно

    expect(teardown).toHaveBeenCalledTimes(1);
  });
});
```

- Называйте тесты по наблюдаемому поведению, а не по реализации
  (`disposes collected atoms on destroy`, а не `calls subscriptions.next`).
- Для шедулеров и эффектов используйте `runEffects()` вместо `setTimeout` /
  `await` — это даёт детерминизм.

## Паттерн: минимум комментариев, но полезные, если есть

- Самоговорящие имена и маленькие функции лучше комментариев.
- Комментарий оправдан, когда *почему* неочевидно — скрытый инвариант,
  обход бага в зависимости, особенность жизненного цикла. Не описывайте
  *что* код и так говорит сам.
