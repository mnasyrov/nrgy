# Controllers

## Назначение

Эта страница описывает controller как основную единицу бизнес-логики в
Nrgy.js.

## Базовая декларация

`declareController()` - это основной API для описания controller logic. Он
позволяет задать, как создаётся экземпляр контроллера, каким состоянием он
владеет, какие actions он отдаёт наружу и какие ресурсы должны уничтожаться
вместе с ним.

```ts
import { declareController, readonlyAtom } from '@nrgyjs/core';

export const SearchController = declareController(({ scope }) => {
  const query = scope.atom('');
  const loading = scope.atom(false);

  return {
    state: {
      query: readonlyAtom(query),
      loading: readonlyAtom(loading),
    },
    setQuery: (value: string) => query.set(value),
    search: async () => {
      loading.set(true);

      try {
        // async work
      } finally {
        loading.set(false);
      }
    },
  };
});
```

Типовой shape контроллера:

```ts
declareController(({ scope }) => {
  const localState = scope.atom(initialValue);

  return {
    state: {
      localState: readonlyAtom(localState),
    },
    actionName: () => {
      // mutate state or call services
    },
  };
});
```

## Что должен делать controller

- владеть локальным состоянием фичи
- координировать effects и services
- превращать внешние зависимости в поведение, удобное для UI
- отдавать маленький и стабильный контракт

## Чего controller делать не должен

- рендерить UI
- зависеть напрямую от конкретного компонента
- превращаться в свалку несвязанных состояний приложения

## Params и зависимости

Есть два основных способа передать внешние данные в controller:

- constructor params для feature-specific inputs
- extensions и DI для инфраструктурных зависимостей

Это важно не смешивать. Входные данные фичи и wiring сервисов решают разные
задачи.

### Params

Params подходят в тех случаях, когда controller нужны внешние feature inputs,
известные вызывающему коду и не являющиеся инфраструктурными зависимостями.

Типичные примеры:

- initial value
- entity identifier
- screen-specific configuration

Params надо держать явными и близкими к границе фичи.

### Extensions

Extensions подходят, когда controller нужны интеграции, которые должны
сшиваться снаружи: DI containers, view bindings или другие environment-specific
capabilities.

Именно extensions позволяют связать controller declarations с внешними
системами, не хардкодя эти системы в бизнес-логике.

## Lifecycle

У любого controller должен быть понятный владелец и понятная точка destruction.

Lifecycle controller instance на практике выглядит так:

- экземпляр контроллера создаётся из своей декларации
- он поднимает локальное состояние, subscriptions, child scopes и service
  bindings
- он обслуживает одну feature boundary, пока эта фича жива
- при `destroy()` он обязан освободить все принадлежащие ему ресурсы

Destroy нужен, когда:

- экран размонтируется
- завершается feature flow
- временный процесс больше не нужен

Так остаются под контролем subscriptions, child scopes и внешние ресурсы.

Во время destruction controller должен освободить:

- subscriptions и effects
- child scopes
- long-lived local state, которое не должно оставаться достижимым
- внешние ресурсы, зарегистрированные через cleanup callbacks

## Рекомендуемая публичная форма

Для большинства фич хорошо работает такой shape:

```ts
{
  state: { ...atomsExposedAsReadonly },
  actionA() {},
  actionB() {},
}
```

State и actions должны читаться быстро и однозначно.

## Class-Based Controllers

Class-based controllers стоит использовать только там, где действительно нужна 
семантика классов, например:

- интеграция с кодом, который ожидает class instances
- customization через inheritance в legacy-коде
- framework или tooling constraints, требующие class-shaped API

Базовым вариантом для документации по умолчанию должны оставаться
declaration-first controllers на базе `declareController()`, потому что они
прямее выражают публичный контракт и lifecycle.
