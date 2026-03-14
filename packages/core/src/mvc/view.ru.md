# `view.ts`

## Назначение файла

Модуль описывает типы представления (`View`) и контракты связки между
контроллером и UI-слоем.

## Общая информация

Файл не содержит runtime-логики, но определяет публичные типы, которые
используются в `withView()`, `createViewProxy()` и React-интеграциях. Через эти
контракты контроллер получает props представления в виде атомов и сигналы
жизненного цикла view.

## Концептуальная архитектура

Модуль разделяет view на три концепции:

1. `ViewProps`: входные props произвольного представления.
2. `ViewPropAtoms<TProps>`: реактивное представление props в виде атомов.
3. `ViewBinding<TProps>`: контракт событий `mount`, `update`, `unmount` и
   доступа к `props` и `status`.

Это позволяет UI-адаптерам описывать lifecycle-изменения независимо от
конкретного фреймворка.

## Описание публичного API

### `ViewProps`

- Тип `Record<string, unknown>`.
- Определяет базовую форму props представления.

### `ViewPropAtoms<TProps>`

- Преобразует объект props в объект атомов того же ключевого состава.

### `ViewStatus`

- Может быть `'unmounted'`, `'mounted'` или `'destroyed'`.

### `ViewStatuses`

- Константный объект с допустимыми значениями `ViewStatus`.

### `ViewBinding<TProps>`

- `props`: атомы props представления.
- `status`: атом текущего статуса view.
- `onMount(listener)`, `onUpdate(listener)`, `onUnmount(listener)`: подписки на
  lifecycle-сигналы.

## Примеры использования

```ts
import type { ViewBinding } from '@nrgyjs/core';

type UserProps = { id: string };

function bindView(view: ViewBinding<UserProps>) {
  view.onMount(() => {
    console.log(view.props.id());
  });
}
```

