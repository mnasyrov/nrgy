# `types.ts`

## Назначение файла

Модуль описывает контракты `Scope` и связанных с ним teardown-ресурсов.

## Общая информация

Файл задает интерфейсы, через которые пользователи и внутренние части пакета
взаимодействуют с управлением жизненным циклом. Эти типы используются в
контроллерах, утилитах и внешних интеграциях.

## Концептуальная архитектура

Модуль разделяет роли ресурсов:

- `Unsubscribable` для объектов с `unsubscribe()`;
- `Destroyable` для объектов с `destroy()`;
- `ScopeTeardown` как объединение функций и ресурсов;
- `Scope` как основной lifecycle-контейнер;
- `SharedScope` как безопасная версия без публичного `destroy()`.

Эти контракты позволяют унифицировать очистку ресурсов независимо от их
конкретной реализации.

## Описание публичного API

### `interface Unsubscribable`

- Требует метод `unsubscribe(): void`.

### `interface Destroyable`

- Требует метод `destroy(): void`.

### `type ScopeTeardown`

- Может быть `Unsubscribable`, `Destroyable` или callback-функцией.

### `interface Scope extends Destroyable`

- Предоставляет методы `onDestroy`, `add`, `destroy`, `createScope`, `atom`,
  `effect`, `syncEffect`.

### `type SharedScope`

- Экспортирует публичный интерфейс `Scope` без метода `destroy`.

## Примеры использования

```ts
import type { Destroyable, ScopeTeardown } from '@nrgyjs/core';

const resource: Destroyable = {
  destroy() {},
};

const teardown: ScopeTeardown = resource;
```

---

Translation: [EN](./types.md) | RU
