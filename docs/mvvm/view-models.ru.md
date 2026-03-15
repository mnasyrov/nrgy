# View Models

## Назначение

Эта страница объясняет, как думать о view model в Nrgy.js.

## View model как контракт

View model является контрактом между бизнес-логикой и представлением.

Хорошая view model:

- отдаёт только те данные, которые нужны view
- отдаёт только те actions, которые view имеет право вызывать
- скрывает service orchestration и workflow details
- остаётся пригодной для нескольких реализаций представления

## Пример

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

export const CounterViewModel = declareViewModel(({ scope, view }) => {
  const count = scope.atom(view.props.initialValue());

  return {
    state: {
      count: readonlyAtom(count),
    },
    increment: () => count.update((value) => value + 1),
  };
});
```

## MVC vs MVVM

Полезнее всего формулировать различие практично:

- MVC чаще держит явную координацию и binding-логику в controller
- MVVM переносит большую часть view-facing связи в модель, к которой view
  привязывается
- оба подхода отделяют rendering от business logic, но MVVM сильнее
  акцентирует чистый публичный контракт для view

Для документации Nrgy.js полезнее всего не историческая чистота терминов, а
показ того, как сделать views тонкими, а бизнес-flow переиспользуемыми.

## Что важно описывать в docs

Для каждой view model стоит явно фиксировать:

- какие входы ей нужны
- какие state fields она отдаёт
- какие actions поддерживает
- кто владеет её lifecycle

Это потом сильно упрощает перенос в React wrappers и публичную документацию.

Для React-интеграции `withViewModel()` является важным MVVM helper-ом, потому
что делает границу view model явной на уровне компонента.
