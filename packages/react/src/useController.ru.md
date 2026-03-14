# `useController.ts`

## Назначение файла

Модуль содержит хук `useController()`, который создает и сопровождает экземпляр
контроллера или view-model внутри React-компонента.

## Общая информация

`useController()` является основной точкой интеграции между React и
`@nrgyjs/core`. Хук принимает декларацию контроллера или view-model, при
необходимости передает в нее props представления, а затем синхронизирует
жизненный цикл созданного экземпляра с жизненным циклом React-компонента.

## Концептуальная архитектура

Работа хука строится следующим образом:

1. Из `NrgyControllerExtension` извлекаются React-специфичные
   `ExtensionParamsProvider`.
2. Для текущих props создается `ViewProxy` через `createViewProxy()`.
3. К списку provider'ов добавляется `provideView(view)`, после чего создается
   экземпляр контроллера: `new declaration(providers)`.
4. Экземпляр и связанный `ViewProxy` сохраняются в `useRef()`, чтобы не
   пересоздавать их на каждом рендере.
5. В отдельном `useEffect()` хук передает новые props в `view.update(props)`.
6. В lifecycle-эффекте вызываются `view.mount()` при монтировании и
   `view.destroy()` вместе с `controller.destroy()` при размонтировании или
   замене декларации.

Дополнительно хук повторно вызывает extension-provider'ы на последующих
рендерах, чтобы сохранить корректный порядок React-хуков внутри расширений.

## Описание публичного API

### `useController<TContext, TService>(declaration): TService`

- `declaration`: декларация контроллера или view-model без обязательных
  view-props.
- Возвращает созданный экземпляр сервиса `TService`.

### `useController<TContext, TService, TProps>(declaration, props): TService`

- `declaration`: декларация контроллера или view-model, зависящая от props
  представления.
- `props`: объект props, который передается в `ViewProxy`.
- Возвращает экземпляр сервиса `TService`.

## Примеры использования

```tsx
import React from 'react';
import { declareController, withView } from '@nrgyjs/core';
import { useController } from '@nrgyjs/react';

const GreetingController = declareController()
  .extend(withView<{ name: string }>())
  .apply(({ view }) => ({
    title: () => `Hello, ${view.props.name()}!`,
  }));

export function Greeting(props: { name: string }) {
  const controller = useController(GreetingController, props);

  return <h1>{controller.title()}</h1>;
}
```

---

Translation: [EN](./useController.md) | RU
