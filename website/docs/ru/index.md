---
layout: home

hero:
  name: Nrgy.js
  text: Сайт документации
  tagline: Портал на VitePress для продуктовой документации, гайдов для контрибьюторов, API пакетов и модульной документации из исходников.
  image:
    src: /assets/logo.svg
    alt: Логотип Nrgy.js
  actions:
    - theme: brand
      text: Открыть документацию
      link: /ru/content/docs/README
    - theme: alt
      text: Посмотреть пакеты
      link: /ru/content/packages/core/README
    - theme: alt
      text: Обзор проекта
      link: /ru/content/project/README

features:
  - title: Генерируется из исходников
    details: Сайт зеркалит markdown, который уже поддерживается в репозитории, поэтому продуктовая документация, гайды для контрибьюторов и пакетная документация остаются в одном источнике.
  - title: Фокус на продуктовой документации
    details: Основное дерево документации начинается с Введения, Быстрого старта, Core, Архитектуры, MVVM, Интеграций, Рецептов, Миграции и FAQ.
  - title: Не засоряет git
    details: Сгенерированный контент и build-артефакты VitePress исключены из git через локальный website-level ignore.
---

## Как это работает

Запускайте сайт из отдельного проекта [`website/package.json`](/ru/content/project/README):

```bash
cd website
npm install
npm run dev
```

`npm run prepare` пересобирает `website/docs/content` и `website/docs/ru/content` из markdown-файлов репозитория перед `dev` и `build`.

На сайте есть три основные группы документации:

- продуктовая документация из `docs/*`;
- материалы для контрибьюторов из `docs/contributing/*`;
- пакетная и модульная документация из `packages/*`.
