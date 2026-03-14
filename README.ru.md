# Nrgy.js

<img alt="energy" src="energy.svg" width="120" />

Nrgy.js — это TypeScript-first набор пакетов для реактивного состояния,
эффектов и построения архитектуры приложений в стиле MVC/MVVM.

[![licence](https://img.shields.io/github/license/mnasyrov/nrgy.svg)](https://github.com/mnasyrov/nrgy/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mnasyrov/nrgy/badge.svg?branch=main)](https://coveralls.io/github/mnasyrov/nrgy?branch=main)

## Описание проекта

Nrgy.js предоставляет набор небольших пакетов для построения реактивных
приложений с явным управлением жизненным циклом и опциональными интеграциями с
React, RxJS, `rx-effects` и `ditox`.

## Обзор проекта

Проект построен вокруг нескольких ключевых идей:

- атомы и вычисляемые атомы для реактивного состояния;
- эффекты и scheduler'ы для детерминированного распространения изменений;
- `Scope` для владения ресурсами и их очистки;
- контроллеры и view-model для бизнес-логики в стиле MVC/MVVM;
- опциональные пакеты интеграции для React, `ditox`, RxJS и `rx-effects`.

Пакеты спроектированы так, чтобы работать независимо друг от друга, поэтому
пользователь может подключать только нужные части.

## Основные возможности

- Реактивное состояние через `atom()`, `compute()` и `effect()`
- Явное управление жизненным циклом через `Scope`
- MVC/MVVM-примитивы для контроллеров и view-model
- React-интеграция через хуки и higher-order components
- Интероперабельность с RxJS и `rx-effects`
- Интеграция dependency injection через `ditox`
- Строго типизированный TypeScript-first API

## Изменения

- [Журнал изменений проекта](./CHANGELOG.md)

## Установка

Устанавливайте только те пакеты, которые действительно нужны:

| Пакет | Назначение | Установка |
| --- | --- | --- |
| `@nrgyjs/core` | Реактивный runtime, `Scope`, MVC/MVVM-примитивы | `npm install @nrgyjs/core` |
| `@nrgyjs/react` | React-привязки для атомов, контроллеров и view-model | `npm install @nrgyjs/core @nrgyjs/react react` |
| `@nrgyjs/ditox` | DI-extensions для `ditox` | `npm install @nrgyjs/core @nrgyjs/ditox ditox` |
| `@nrgyjs/ditox-react` | React-мост для `ditox` и Nrgy-контроллеров | `npm install @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react` |
| `@nrgyjs/rxjs` | Интеграция с RxJS | `npm install @nrgyjs/core @nrgyjs/rxjs rxjs` |
| `@nrgyjs/rx-effects` | Интеграция с `rx-effects` | `npm install @nrgyjs/core @nrgyjs/rxjs @nrgyjs/rx-effects rx-effects rxjs` |

## Документация

- [Обзор документации](./docs/README.ru.md)
- [Документация для разработчиков и агентов](./docs/developers/README.ru.md)

## Список пакетов

- [@nrgyjs/core](./packages/core/README.ru.md)
- [@nrgyjs/react](./packages/react/README.ru.md)
- [@nrgyjs/ditox](./packages/ditox/README.ru.md)
- [@nrgyjs/ditox-react](./packages/ditox-react/README.ru.md)
- [@nrgyjs/rxjs](./packages/rxjs/README.ru.md)
- [@nrgyjs/rx-effects](./packages/rx-effects/README.ru.md)

