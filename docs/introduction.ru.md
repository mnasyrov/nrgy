# Введение

## Назначение

Эта страница вводит Nrgy.js на продуктном уровне перед переходом к API и
архитектурным разделам.

## Что такое Nrgy.js

Nrgy.js - это библиотека для отделения бизнес-логики и состояния от UI,
построенная на реактивном ядре с controllers и MVVM/MVC-паттернами.

На верхнем уровне Nrgy.js сочетает:

- реактивное ядро для state, derivations и effects
- явный lifecycle и cleanup через scopes и destroy points
- controllers и view models как границы feature-level logic
- тонкие и заменяемые UI-интеграции

## Какую проблему он решает

Nrgy.js решает следующий класс задач:

- позволяет держать бизнес-логику независимо от UI
- помогает переиспользовать одну и ту же feature logic в нескольких
  представлениях
- делает lifecycle и cleanup явными и управляемыми
- упрощает интеграцию логики с React и dependency injection

Он особенно полезен в тот момент, когда приложение перерастает
component-local state и случайные side effects.

## Путь чтения

Если читатель только знакомится с Nrgy.js, лучше идти в таком порядке:

1. Сначала читать [Быстрый старт](./quick-start.ru.md).
2. Затем пройти [Core](./core/README.ru.md).
3. После этого перейти к [MVVM и Controllers](./mvvm/README.ru.md).
4. Затем прочитать [Архитектуру](./architecture/README.ru.md) и
   [Интеграции](./integrations/README.ru.md).
5. Дальше использовать по необходимости [Рецепты](./recipes/README.ru.md),
   [Миграцию](./migration/README.ru.md) и [FAQ](./faq/README.ru.md).
