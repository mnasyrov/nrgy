# React

## Назначение

Эта страница объясняет, как подключать controllers, view models и atoms из
Nrgy.js к React-компонентам.

## Основные API

`@nrgyjs/react` предоставляет основной слой React-интеграции:

- `useAtom()`
- `useAtoms()`
- `useController()`
- `withViewController()`
- `withViewModel()`
- `NrgyControllerExtension`

## Подписка на atoms

`useAtom()` нужен, когда компонент зависит от одного atom.

```tsx
import React from 'react';
import { useAtom } from '@nrgyjs/react';

function CounterValue({ controller }: { controller: CounterController }) {
  const count = useAtom(controller.state.count);

  return <span>{count}</span>;
}
```

`useAtoms()` нужен, когда компонент читает несколько atoms как один стабильный
объект.

```tsx
import React from 'react';
import { useAtoms } from '@nrgyjs/react';

function SearchState({ controller }: { controller: SearchController }) {
  const { query, loading } = useAtoms(controller.state);

  return <span>{loading ? `Loading ${query}` : query}</span>;
}
```

## Создание controller в React

`useController()` нужен, когда компонент должен сам создать и владеть
экземпляром контроллера.

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

`useController()` является самым прямым способом связать controller или view
model с React lifecycle.

## Higher-Level Bindings

`withViewController()` и `withViewModel()` подходят, когда нужен wrapper,
который инжектит controller или view model в props компонента.

Эти helper-ы полезны, когда:

- нужен декларативный wrapper вокруг component wiring
- команда предпочитает HOC-style composition
- view props должны быть явно связаны с созданием controller/view model

### withViewController()

`withViewController()` оборачивает React-компонент и инжектит экземпляр
controller в его props.

Его стоит использовать, когда:

- команда предпочитает HOC-based composition вместо прямого вызова
  `useController()`
- создание controller должно быть задекларировано рядом с component boundary
- view должна явно получать controller-shaped contract через props

Для MVVM-style UI composition это важный helper, потому что он оставляет
компоненту только rendering, а создание controller и его lifecycle удерживает
в wrapper layer.

### withViewModel()

`withViewModel()` оборачивает React-компонент и инжектит экземпляр view model в
его props.

Его стоит использовать, когда:

- view должна зависеть от presentation contract, а не от сырого service wiring
- state и actions должны попадать в компонент через view-model boundary
- команда хочет сделать MVVM composition явной на уровне React-компонента

Это один из самых важных React helper-ов для MVVM в Nrgy.js, потому что он
делает view-model contract видимым в API компонента и при этом оставляет
бизнес-логику вне view.

## Как избегать лишних ререндеров

- использовать `useAtom()` для одного atom вместо подписки на более крупный
  state object
- использовать `useAtoms()`, когда несколько atoms рендерятся вместе
- отдавать из controllers и view models узкий view-facing state
- не передавать большие mutable state bags через одну component boundary

## Extensions в React

`NrgyControllerExtension` позволяет React-компонентам передавать extension
providers в создание вложенных controllers. Так React-side wiring, включая DI,
может попадать в `useController()`.
