# `controller.ts`

## Назначение файла

Модуль реализует декларативный API контроллеров Nrgy.js: типы контекста,
extensions, builder деклараций и runtime-конструктор контроллера.

## Общая информация

Этот файл является центром MVC/MVVM-слоя в `@nrgyjs/core`. Через него
определяются:

- типы контроллеров и сервисов;
- контекст контроллера с `scope` и параметрами;
- механизм extensions;
- фабричный и class-based способ объявления контроллеров.

Другие MVC-модули, включая `withView()` и `declareViewModel()`, строятся поверх
этих контрактов.

## Концептуальная архитектура

Архитектура модуля состоит из нескольких частей:

1. Базовые типы `Controller`, `ControllerDeclaration`,
   `BaseControllerContext`, `ExtensionFn`.
2. `BaseController`, который создает `ControllerContext`, откладывает
   `onCreated()` в microtask и уничтожает `Scope` в `destroy()`.
3. `ControllerDeclarationBuilder`, позволяющий пошагово добавлять `params()` и
   `extend()`, а затем завершать декларацию через `apply()` или
   `getBaseClass()`.
4. `createControllerContext()`, которая собирает `scope`, параметры, extension
   params и helper `create()` для вложенного создания контроллеров.
5. Провайдеры `provideControllerParams()` и `provideExtensionParams()`, через
   которые параметры прокидываются в extension-механику.

Такой дизайн поддерживает функциональные и class-based контроллеры с единым
жизненным циклом.

## Описание публичного API

### Основные типы

- `BaseService`: базовый тип сервиса контроллера.
- `Controller<TService>`: сервис с обязательным методом `destroy()`.
- `ControllerParams`, `BaseControllerContext`, `ControllerParamsContext<T>`:
  типы параметров и контекста.
- `ExtensionFn<TSourceContext, TContextExtension>`: функция расширения
  контекста контроллера.
- `ExtensionParamsProvider`: provider дополнительных параметров для extensions.
- `ControllerDeclaration<TContext, TService>`: тип конструктора контроллера.
- `ControllerContext<TContext>`: контекст фабрики контроллера с helper-методом
  `create()`.
- `ControllerFactory<TContext, TService>`: фабрика функционального контроллера.

### Классы и ошибки

- `ControllerConstructorError`: ошибка создания контроллера.
- `BaseController<TContext>`: базовый класс для class-based контроллеров.
- `ControllerDeclarationBuilder<TContext>`: builder декларации контроллера.

### Функции

- `declareController(factory?)`: создает либо готовую декларацию, либо builder.
- `provideControllerParams(params)`: упаковывает params в
  `ExtensionParamsProvider`.
- `provideExtensionParams(params)`: добавляет произвольные extension-параметры.

## Примеры использования

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController()
  .params<{ initialValue: number }>()
  .apply(({ scope, params }) => {
    const count = scope.atom(params.initialValue);

    return {
      count,
      increase: () => count.update((prev) => prev + 1),
    };
  });

const controller = new CounterController({ initialValue: 5 });
```

```ts
import { BaseController, type ControllerParamsContext } from '@nrgyjs/core';

class LoggerController extends BaseController<
  ControllerParamsContext<{ prefix: string }>
> {
  log(message: string) {
    console.log(this.params.prefix, message);
  }
}
```

