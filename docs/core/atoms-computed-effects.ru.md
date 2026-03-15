# Atoms, Computed и Effects

## Назначение

Эта страница описывает три примитива, которые используются в Nrgy.js чаще
всего.

## Atom

`atom()` хранит изменяемое реактивное состояние.

```ts
import { atom } from '@nrgyjs/core';

const userName = atom('Alice', { label: 'userName' });

userName.set('Bob');
userName.update((value) => value.trim());
```

Можно также переопределить equality и cleanup-поведение:

```ts
import { atom } from '@nrgyjs/core';

const user = atom(
  { id: '1', name: 'Alice' },
  {
    equal: (a, b) => a.id === b.id && a.name === b.name,
    onDestroy: () => {
      console.log('user atom destroyed');
    },
  },
);
```

Важные свойства:

- Атом является функцией. Чтобы прочитать значение, нужно вызвать его.
- Source atom имеет `set()`, `update()`, `mutate()` и `destroy()`.
- `withUpdates()` позволяет описать именованные update helpers поверх atom.
- Равенство значений можно переопределить через `equal`.
- Cleanup можно привязать через `onDestroy`.

Atom подходит для состояния, которое меняется во времени и должно наблюдаться
другими частями системы.

Если несколько обновлений образуют стабильное API, `withUpdates()` позволяет
сделать его явным:

```ts
const count = atom(0).withUpdates({
  increase: (value, step: number = 1) => value + step,
  decrease: (value, step: number = 1) => value - step,
});

count.updates.increase();
count.updates.decrease(2);
```

## Compute

`compute()` создаёт производный atom из других atoms.

```ts
import { atom, compute } from '@nrgyjs/core';

const price = atom(100);
const quantity = atom(2);
const total = compute(() => price() * quantity(), { label: 'total' });
```

`compute()` использует динамический трекинг зависимостей. Он подписывается на
те atoms, которые действительно были прочитаны во время выполнения вычисления.

```ts
const mode = atom<'price' | 'quantity'>('price');
const selected = compute(() => {
  return mode() === 'price' ? price() : quantity();
});
```

В этом примере активная зависимость может меняться между запусками. Поэтому
вычисление должно оставаться чистым и детерминированным.

Правила для `compute()`:

- Оставлять выражение чистым.
- Не писать в atoms изнутри вычисления.
- Делать вычисление быстрым.
- Не перегружать `compute()` тяжёлыми сортировками и большими преобразованиями,
  если это можно организовать в другом слое.

`computed` следует использовать как место для детерминированного вывода
значений, а не для выполнения workflow.

Почему внутри `compute()` запрещены записи в state:

- это ломает разделение между derivation и effects
- это может создавать нестабильные или циклические графы обновлений
- это усложняет модель dependency tracking
- это превращает чистую фазу чтения в скрытое выполнение workflow

## Effect

`effect()` реагирует на изменения atoms или computed atoms.

```ts
import { atom, effect } from '@nrgyjs/core';

const count = atom(0);

const subscription = effect(count, (value) => {
  console.log('Count changed:', value);
});

count.set(1);
subscription.destroy();
```

По умолчанию `effect()` работает отложенно. `syncEffect()` выполняется в
синхронной очереди.

```ts
import { atom, effect, syncEffect } from '@nrgyjs/core';

const value = atom(0);

effect(value, (next) => {
  console.log('deferred', next);
});

syncEffect(value, (next) => {
  console.log('sync', next);
});

value.set(1);
```

`effect()` нужен для:

- логирования
- синхронизации с внешними системами
- запуска асинхронной работы
- обновления UI-адаптеров

`syncEffect()` стоит использовать только там, где действительно нужна
синхронная реакция и понятен порядок выполнения.

Модель выполнения:

- создание эффекта обычно вызывает initial run, чтобы подписчик сразу увидел
  текущее значение
- `effect()` обычно наблюдается после завершения текущего синхронного update
  flow
- `syncEffect()` реагирует в синхронной очереди
- batched updates позволяют отложенным эффектам увидеть финальное согласованное
  состояние
- первый запуск эффекта является частью setup подписки, если иное не задано
  его опциями

## Как выбирать примитив

Нужно задавать три вопроса:

- Это изменяемое состояние? Значит `atom()`.
- Это чистое производное значение? Значит `compute()`.
- Это реакция с сайд-эффектом? Значит `effect()`.

## Частые ошибки

- Изменение состояния внутри `compute()`.
- Использование `compute()` как места для async workflow.
- Хранение больших объектов без явной стратегии destruction.
- Использование effects как замены доменному моделированию.
- Использование `syncEffect()` по умолчанию без реальной необходимости в
  строгом порядке.
- Перенос workflow в UI-код вместо контроллеров.
