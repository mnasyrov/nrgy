---
layout: home

hero:
  name: Nrgy.js
  text: Сайт документации
  tagline: Портал на VitePress для API пакетов, developer-гайдов и модульной документации из исходников.
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
    details: Сайт зеркалит markdown, который уже поддерживается в репозитории, поэтому пакетная и developer-документация остаются в одном источнике.
  - title: Навигация вокруг пакетов
    details: Документация по Core, React, Ditox, RxJS и rx-effects собрана в отдельный sidebar вместо разрозненных ссылок по README.
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
