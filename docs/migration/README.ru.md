# Миграция

## Назначение

Эта страница объясняет, как мигрировать со старой линейки пакета `nrgy`,
например с `nrgy@0.0.46`, на текущую структуру пакетов `@nrgyjs/*` и новый API.

## Что изменилось в новой версии

Миграция здесь не сводится только к переименованию импортов. Изменились и
модель публикации пакетов, и рекомендуемая архитектура.

Главные изменения:

- старый монолитный пакет `nrgy` был разделён на scoped-пакеты:
  `@nrgyjs/core`, `@nrgyjs/react`, `@nrgyjs/ditox`,
  `@nrgyjs/ditox-react`, `@nrgyjs/rxjs` и `@nrgyjs/rx-effects`
- MVC/MVVM API теперь в основном живут в `@nrgyjs/core` и `@nrgyjs/react`
- рекомендуемая модель стала более явной: controller или view-model driven
  логика с понятным lifecycle и cleanup
- старые store-oriented и effect-state oriented паттерны больше не являются
  предпочтительным направлением для нового кода

Если сравнивать с `nrgy@0.0.46`, то самый заметный шаг миграции - это split по
пакетам:

- `nrgy` -> `@nrgyjs/core`
- `nrgy/react` и `nrgy/mvc-react` -> `@nrgyjs/react`
- `nrgy/ditox` -> `@nrgyjs/ditox`
- `nrgy/ditox-react` -> `@nrgyjs/ditox-react`
- `nrgy/rxjs` -> `@nrgyjs/rxjs`
- `nrgy/rx-effects` -> `@nrgyjs/rx-effects`

Старый пакет также экспортировал entry points, у которых нет прямого
современного эквивалента как first-class рекомендации:

- `nrgy/store`
- `nrgy/rxjs-react`
- старые signal-oriented helpers из монолита

## Таблица импортов

| Старый импорт | Новый импорт |
| --- | --- |
| `nrgy` | `@nrgyjs/core` |
| `nrgy/mvc` | `@nrgyjs/core` |
| `nrgy/react` | `@nrgyjs/react` |
| `nrgy/mvc-react` | `@nrgyjs/react` |
| `nrgy/ditox` | `@nrgyjs/ditox` |
| `nrgy/ditox-react` | `@nrgyjs/ditox-react` |
| `nrgy/rxjs` | `@nrgyjs/rxjs` |
| `nrgy/rx-effects` | `@nrgyjs/rx-effects` |
| `nrgy/store` | прямой замены пакета нет; переписывать на примитивы `@nrgyjs/core` |
| `nrgy/rxjs-react` | прямой замены пакета нет; осознанно использовать `@nrgyjs/react` и `@nrgyjs/rxjs` |

## Какие концепции считаются legacy

Следующие концепции стоит считать legacy при миграции старого кода:

- store-first организация состояния через `nrgy/store`
- `declareStore`, `createStore`, `createStoreUpdates`, `declareStateUpdates`
- старые effect-state паттерны, которые больше не рекомендуются
- старые MVC-specific формы, не совпадающие с текущей рекомендуемой
  controller/view-model архитектурой
- `rxjs-react` как отдельный integration path из монолитного пакета
- `rx-effects` как всё менее актуальная интеграция для большинства команд

На уровне самого `nrgy@0.0.46` тоже есть сигналы:

- в `nrgy/store` уже были deprecated helpers вроде `pipeStateMutations`
- старый монолит экспортировал `signal`, `signalChanges`, `mixSignals` и
  другие signal-first utilities, которые больше не находятся в центре текущей
  продуктовой документации

## Что не стоит писать в новом коде

Не стоит писать в новом коде:

- новые store-based state layers на базе `declareStore` и связанных API
- новые effect-state style abstractions, если тот же workflow можно выразить
  через atoms, effects, scopes, controllers или view models
- новый код, который неявно смешивает UI lifecycle и business lifecycle
- новый код, завязанный на старую монолитную структуру пакета
- новые инвестиции в `rx-effects`, если только не нужно поддерживать уже
  существующую интеграцию

Вместо этого стоит предпочитать:

- `atom`, `compute`, `effect`, `scope` и `batch` из `@nrgyjs/core`
- `declareController()` для business logic boundaries
- `declareViewModel()` для UI-facing contracts
- `@nrgyjs/react` для React bindings
- `@nrgyjs/ditox` и `@nrgyjs/ditox-react` для DI

## Таблица концепций

| Старая концепция | Рекомендуемый современный паттерн |
| --- | --- |
| монолитный пакет `nrgy` | scoped-пакеты `@nrgyjs/*` по зонам ответственности |
| `nrgy/store` | atoms, computed atoms, effects, scopes, controllers и view models |
| `declareStore` и store update helpers | `atom()`, `compute()`, `batch()` и actions controller/view model |
| кастомные наборы state updates | `atom.withUpdates()` для именованных обновлений atom |
| effect-state style abstractions | plain atoms плюс явные actions и effects |
| business logic внутри UI | feature logic внутри controller или view model |
| неявное владение ресурсами | явные scopes и `destroy()` |
| `rxjs-react` как отдельные hooks | `@nrgyjs/react` для UI-binding и `@nrgyjs/rxjs` только там, где действительно нужен stream bridge |
| серьёзная ставка на `rx-effects` | считать legacy-oriented, если только не поддерживается существующий код |

## Как переписать старый controller/store/effect-state

### Старые импорты controller API

Если старый код импортирует из монолита:

```ts
import { declareController } from 'nrgy/mvc';
import { useController } from 'nrgy/mvc-react';
```

то переходить нужно на:

```ts
import { declareController } from '@nrgyjs/core';
import { useController } from '@nrgyjs/react';
```

### Старый store-based state

Если код использует store-based API из `nrgy/store`, его лучше переписывать в
сторону:

- atoms для mutable state
- computed atoms для derivations
- effects для reactions
- controller или view model как границы фичи
- `atom.withUpdates()` там, где нужны явные именованные обновления поверх atom

Это обычно не one-to-one rename, а именно структурное переписывание из
store-first модели в явное реактивное состояние и lifecycle ownership.

Например, store update helpers часто можно переписать в именованные atom
updates:

```ts
const count = atom(0).withUpdates({
  increase: (value, step: number = 1) => value + step,
  decrease: (value, step: number = 1) => value - step,
});

count.updates.increase();
count.updates.decrease(2);
```

### Старые effect-state паттерны

Если код использует effect-state style patterns, лучше мигрировать его к:

- plain atoms для state
- actions контроллера или view model для workflow steps
- effects только там, где реально нужны side effects

Ключевая идея в том, чтобы сделать writes, derivations и cleanup явными, а не
прятать их в custom effect-state layers.

### Старая логика внутри экранов

Если screen logic живёт прямо в React-компонентах, переносить её лучше в:

- controller, если логика в основном business-oriented
- view model, если контракт в первую очередь UI-facing

### Старый DI wiring

Если сервисы сейчас wiring-ятся неявно или через globals, лучше переводить код
на:

- `withContainer()`
- `withInjections()`
- `applyInjections()`
- `DitoxNrgyExtension` в React-приложениях

## Чеклист миграции

1. Заменить монолитные `nrgy/*` импорты на соответствующие `@nrgyjs/*` пакеты.
2. Найти usages `nrgy/store` и запланировать переписывание на atoms, effects,
   controllers или view models.
3. Вынести business logic из React-компонентов в controllers или view models.
4. Заменить неявное владение ресурсами на явные scopes и `destroy()`.
5. Пересмотреть long-lived state и добавить cleanup strategy там, где она
   нужна.
6. Отделить feature params от injected services.
7. Перенести DI wiring на `@nrgyjs/ditox` и `@nrgyjs/ditox-react`.
8. Считать `rx-effects` legacy-oriented интеграцией, если только она уже не
   используется в production и не требует поддержки.
