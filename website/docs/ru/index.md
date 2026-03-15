---
layout: home

hero:
  name: Nrgy.js
  text: Реактивная бизнес-логика вне UI
  tagline: Стройте UI-независимое состояние, эффекты, контроллеры и view models поверх небольшого реактивного ядра.
  image:
    src: /assets/logo.svg
    alt: Логотип Nrgy.js
  actions:
    - theme: brand
      text: Быстрый старт
      link: /ru/content/docs/quick-start
    - theme: alt
      text: Читать документацию
      link: /ru/content/docs/README

features:
  - title: UI-независимая логика
    details: Держите бизнес-правила вне React-компонентов и переиспользуйте их в нескольких представлениях.
  - title: Реактивное ядро
    details: Описывайте состояние через atoms, computed values, effects, scopes и явное управление lifecycle.
  - title: Controller и ViewModel паттерны
    details: Отдавайте UI чистый presentation contract и держите orchestration и зависимости вне компонентов.
---

## Начните с правильного маршрута

Nrgy.js сочетает небольшое реактивное ядро с архитектурными паттернами для
controllers, view models, lifecycle и dependency-aware application logic.

- Core primitives
- MVVM patterns
- React integration
- Migration guides
- Recipes

## Маршруты чтения

Выберите путь под текущую задачу вместо того, чтобы угадывать, с чего начать.

### Если вы впервые видите Nrgy.js

[Введение](/ru/content/docs/introduction) ->
[Быстрый старт](/ru/content/docs/quick-start) ->
[Core](/ru/content/docs/core/README) ->
[MVVM и Controllers](/ru/content/docs/mvvm/README)

### Если проектируете архитектуру приложения

[Архитектура](/ru/content/docs/architecture/README) ->
[MVVM и Controllers](/ru/content/docs/mvvm/README) ->
[Интеграции](/ru/content/docs/integrations/README) ->
[Рецепты](/ru/content/docs/recipes/README)

### Если мигрируете со старой версии

[Миграция](/ru/content/docs/migration/README) ->
[Core](/ru/content/docs/core/README) ->
[Рецепты](/ru/content/docs/recipes/README)

## Что можно строить

Документация сфокусирована на практической структуре приложения, а не только
на изолированных вызовах API.

### Screen view models

Держите состояние экрана, actions и loading flows вне слоя рендера.

### Shared business controllers

Переиспользуйте один business flow в нескольких views и экранах.

### Forms with batched updates

Моделируйте несколько полей и согласованные обновления без утечки логики в UI.

### React + Ditox integration

Связывайте view models и общие сервисы через явные dependency boundaries.

## Разделы документации

Используйте продуктовую документацию как основной путь, а в contributing и
пакетные reference-разделы уходите, когда нужна реализация и детали.

- [Введение](/ru/content/docs/introduction): что такое Nrgy.js, какие задачи он решает и как читать документацию
- [Core](/ru/content/docs/core/README): atoms, computed values, effects, batching, scopes, lifecycle и scheduler behavior
- [Архитектура](/ru/content/docs/architecture/README): слои, границы UI, стратегия переиспользования и контракты между слоями
- [MVVM и Controllers](/ru/content/docs/mvvm/README): роли controller и view model, публичные контракты и ожидания по lifecycle
- [Интеграции](/ru/content/docs/integrations/README): React bindings, dependency injection на базе Ditox и advanced integrations
- [Рецепты](/ru/content/docs/recipes/README): практические примеры для view models, shared state, форм, cleanup и DI
- [Миграция](/ru/content/docs/migration/README): legacy concepts, replacement patterns и guidance по миграции импортов
- [FAQ](/ru/content/docs/faq/README): короткие ответы про effects, batch, scope, destroy, MVVM и React usage
- [Contributing](/ru/content/docs/contributing/README): workflow, кодстайл, правила документации и conventions для агентов
