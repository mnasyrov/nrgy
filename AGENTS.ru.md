# Гайд для агентов

Точка входа для автоматизированных участников (AI-агентов, ботов),
работающих в репозитории Nrgy.js. Людям-контрибьюторам тоже стоит
пробежаться по этому файлу.

## Что это за репозиторий

Nrgy.js — TypeScript-монорепозиторий (Lerna + npm workspaces) с реактивным
рантаймом и MVC/MVVM-примитивами. Публикуемые пакеты лежат в `packages/*`:

- `@nrgyjs/core` — атомы, эффекты, scope, контроллеры, view models.
- `@nrgyjs/react` — React-хуки и HOC для атомов и контроллеров.
- `@nrgyjs/ditox`, `@nrgyjs/ditox-react` — интеграции с DI.
- `@nrgyjs/rxjs`, `@nrgyjs/rx-effects` — интеграция с RxJS.

В `docs/*` живёт продуктовая и контрибьюторская документация. `website/*`
— это собираемый сайт документации (не редактируйте `website/docs/content/*`
руками). `benchmarks/*` — локальные сценарии производительности.

## Команды, которые реально нужны

```bash
npm install           # bootstrap workspaces
npm run format        # biome --write
npm run check         # biome + tsc --noEmit (запускайте перед сдачей задачи)
npm run test          # vitest (single run)
npm run build         # tsdown для всех пакетов
```

Работа с сайтом —
[docs/contributing/development_workflow.ru.md](./docs/contributing/development_workflow.ru.md).
Релизные команды —
[docs/contributing/release_workflow.ru.md](./docs/contributing/release_workflow.ru.md).

## Золотые правила

1. **Документация лежит рядом с исходником.** Изменили
   `packages/core/src/foo.ts` — обновите `foo.md` и `foo.ru.md` в той же
   папке. Тесты (`foo.test.ts`) тоже рядом с исходником.
2. **Никогда не пишите отдельную документацию для `index.ts`.** Поведение
   точек входа документируется в `README.md` пакета.
3. **`.md` и `.ru.md` идут в синхроне.** У каждого английского документа
   есть русский сосед. AI-перевод допустим, расхождение — нет.
4. **Источник правды — `docs/*`, а не `website/docs/content/*`.**
   Генератор сайта пересобирает контент из `docs/*`.
5. **Изменения публичного API идут вместе с тестами, документацией модуля
   и `README.md` пакета.** Не разбивайте это на отдельные PR.
6. **`@nrgyjs/core` framework-agnostic.** Не тащите в него зависимости от
   React, RxJS или DOM.

Полный свод правил по структуре документации —
[docs/contributing/docs_requirements.ru.md](./docs/contributing/docs_requirements.ru.md).

## Стиль работы

- Предпочитайте небольшие точечные правки широким переписываниям.
- Сохраняйте имена пакетов и публичные экспорты, если в задаче не сказано
  иначе.
- Уважайте существующие конвенции по именованию, форматированию и
  жизненному циклу (`destroy()`, `Scope`, `unsubscribe()`).
- Если не запускали проверку (`check`/`test`/`build`) — явно укажите это
  в итоговом отчёте.

## Куда смотреть дальше

- [docs/contributing/README.ru.md](./docs/contributing/README.ru.md) —
  оглавление контрибьюторских гайдов.
- [docs/contributing/coding_style.ru.md](./docs/contributing/coding_style.ru.md)
  — паттерны конкретно этого проекта (Atom, Effect, Scope, Controller).
- [docs/contributing/development_workflow.ru.md](./docs/contributing/development_workflow.ru.md)
  — повседневный workflow, сборка сайта.
- [docs/contributing/docs_requirements.ru.md](./docs/contributing/docs_requirements.ru.md)
  — требования к документации модулей и пакетов.
- [docs/contributing/release_workflow.ru.md](./docs/contributing/release_workflow.ru.md)
  — версионирование и публикация.
- [docs/README.ru.md](./docs/README.ru.md) — полный индекс продуктовой
  документации.
