# Core

## Назначение

Этот раздел описывает базовые примитивы, на которых построен Nrgy.js.

## Обзор

Ценность Nrgy.js не только в реактивности как таковой, а в том, что
реактивность связана с lifecycle, batching и
контроллерно-ориентированной бизнес-логикой.

Ключевые темы:

- writable atoms
- computed atoms
- effects
- scopes
- batching
- scheduling
- cleanup и destruction

## Страницы

- [Atoms, Computed и Effects](./atoms-computed-effects.ru.md)
- [Lifecycle, Batch и Scheduling](./lifecycle-batch-scheduling.ru.md)

## Что важно усвоить

- Производные вычисления должны оставаться чистыми.
- Сайд-эффекты нужно выносить в `effect()` или в actions контроллера.
- Cleanup надо проектировать заранее, а не добавлять постфактум.
- `batch()` нужен там, где несколько обновлений должны наблюдаться как единый
  согласованный переход.
