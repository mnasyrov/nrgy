# `scopeDestructionError.ts`

## Назначение файла

Модуль определяет ошибку `ScopeDestructionError`, которая сигнализирует о
сбоях при уничтожении нескольких ресурсов внутри `Scope`.

## Общая информация

Во время `scope.destroy()` teardown-функции могут выбрасывать ошибки. Вместо
потери части информации пакет агрегирует все ошибки и возвращает их в одном
исключении, чтобы пользователь мог обработать полный набор проблем.

## Концептуальная архитектура

`ScopeDestructionError` является тонким наследником `Error` и содержит поле
`errors`, где сохраняется исходный массив исключений. Этим классом пользуется
`createScope.ts` после завершения полного teardown-прохода по всем ресурсам.

## Описание публичного API

### `class ScopeDestructionError extends Error`

- `errors`: массив ошибок, возникших при уничтожении ресурсов.
- Используется как единый контейнер ошибок во время `Scope.destroy()`.

### `new ScopeDestructionError(errors: unknown[])`

- `errors`: список исходных ошибок.
- Создает экземпляр ошибки с именем `ScopeDestructionError`.

## Примеры использования

```ts
import { ScopeDestructionError, createScope } from '@nrgyjs/core';

const scope = createScope();
scope.onDestroy(() => {
  throw new Error('teardown failed');
});

try {
  scope.destroy();
} catch (error) {
  if (error instanceof ScopeDestructionError) {
    console.log(error.errors.length);
  }
}
```
