# Процесс разработки

## Назначение

Повседневный workflow при работе внутри монорепозитория Nrgy.js. Релизные
команды — в [release_workflow.ru.md](./release_workflow.ru.md).

## Структура репозитория

- `packages/*`: публикуемые пакеты.
- `docs/*`: проектная, пакетная и контрибьюторская документация
  (источник правды).
- `website/*`: генерируемый сайт документации.
- `benchmarks/*`: локальные benchmark-сценарии.

## Основные команды

```bash
npm install           # bootstrap workspaces
npm run format        # biome --write
npm run check         # biome + tsc --noEmit
npm run test          # vitest (single run)
npm run build         # tsdown
```

## Ожидаемый процесс при изменении исходников

1. Обновите исходный файл и colocated-тесты.
2. Обновите colocated-документацию для изменённого модуля
   (см. [docs_requirements.ru.md](./docs_requirements.ru.md)).
3. Обновите пакетный `README.md`, если поменялся публичный API или способ
   использования.
4. Запустите `npm run check`.
5. Для поведенческих изменений запустите `npm run test`.

## Процесс работы с сайтом документации

Источник правды для продуктовой и контрибьюторской документации — дерево
`docs/*`, а не `website/docs/content/*`. Контент сайта в
`website/docs/content/*` и `website/docs/ru/content/*` генерируется скриптом
[website/scripts/generate-content.mjs](../../website/scripts/generate-content.mjs).
При изменении документации сначала обновляйте исходные файлы в `docs/*` и
держите синхронизированными соответствующие `*.ru.md`.

### Команды для сайта

Запускайте команды из [website/package.json](../../website/package.json):

```bash
cd website
npm run dev           # перегенерировать контент + запустить VitePress dev
npm run build         # перегенерировать контент + проверить сборку сайта
```

### Когда нужно обновлять конфигурацию сайта

- Если меняется структура документации, обновляйте sidebar и navigation в
  [website/docs/.vitepress/config.ts](../../website/docs/.vitepress/config.ts).
- Если документы перемещаются между разделами, проверяйте, что
  сгенерированные маршруты в `website/docs/content/docs/*` по-прежнему
  совпадают со ссылками в конфигурации.
- Если для сайта добавляются публичные ассеты, размещайте их в
  `docs/assets/*` или `website/docs/public/*` в зависимости от того, должны
  ли они копироваться генератором контента.
