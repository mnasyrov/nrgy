# Гайд по сайту

Этот сайт является отдельным VitePress-проектом в `website/`. Он не входит в
monorepo workspaces и не добавляет workspace-level связей зависимостей.

## Команды

```bash
cd website
npm install
npm run dev
npm run build
```

## Источники генерируемого контента

`npm run prepare` копирует в `website/docs/content` и
`website/docs/ru/content` следующие материалы из репозитория:

- верхнеуровневые markdown-файлы проекта, например `README.md` и `CHANGELOG.md`;
- документацию репозитория из `docs/`;
- документацию пакетов из `packages/*/README*.md`;
- модульную документацию из `packages/*/src/**/*.md`.

Все скопированные файлы и build-артефакты VitePress игнорируются в
`website/.gitignore`.
