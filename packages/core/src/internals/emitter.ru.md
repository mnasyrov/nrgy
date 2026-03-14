# `emitter.ts`

## Назначение файла

Модуль предоставляет минималистичный внутренний event emitter, который
используется в `@nrgyjs/core` для легковесных lifecycle-уведомлений.

## Общая информация

`Emitter<T>` намеренно сделан очень компактным и не зависит от внешних
библиотек. Он применяется там, где runtime нужен простой примитив
`subscribe/emit/destroy` без подключения полноценной событийной системы.

## Концептуальная архитектура

Реализация строится вокруг `Set` со слушателями:

1. `subscribe()` регистрирует listener и возвращает объект teardown.
2. `emit(value)` проходит по текущему набору слушателей и вызывает каждый
   callback.
3. `destroy()` очищает все слушатели одним действием.

Модуль помечен как internal и используется в основном `ViewProxy` и другими
runtime-helper'ами.

## Описание публичного API

### `type Listener<T> = (value: T) => void`

- Обобщенный тип callback-функции для получаемых значений.

### `type EmitterSubscription = { destroy: () => void }`

- Небольшой teardown-контракт, возвращаемый `subscribe()`.

### `class Emitter<T>`

- `subscribe(listener)`: регистрирует listener и возвращает подписку.
- `emit(value)`: рассылает значение всем слушателям.
- `destroy()`: удаляет всех зарегистрированных слушателей.

## Примеры использования

```ts
import { Emitter } from './emitter';

const emitter = new Emitter<number>();
const subscription = emitter.subscribe((value) => {
  console.log(value);
});

emitter.emit(1);
subscription.destroy();
emitter.destroy();
```

