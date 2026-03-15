---
layout: home

hero:
  name: Nrgy.js
  text: Documentation Website
  tagline: VitePress portal for product docs, contributor guides, package APIs, and source-level module docs.
  image:
    src: /assets/logo.svg
    alt: Nrgy.js logo
  actions:
    - theme: brand
      text: Open Documentation
      link: /content/docs/README
    - theme: alt
      text: Browse Packages
      link: /content/packages/core/README
    - theme: alt
      text: Project Overview
      link: /content/project/README

features:
  - title: Generated From Source
    details: The website mirrors the markdown already maintained in the repository, so product docs, contributor guides, and package docs stay in one place.
  - title: Product Docs First
    details: The main docs tree now starts with Introduction, Quick Start, Core, Architecture, MVVM, Integrations, Recipes, Migration, and FAQ.
  - title: Repository Friendly
    details: Generated content and VitePress build artifacts stay out of git through a local website-level ignore file.
---

## How This Site Works

Run the website from the standalone [`website/package.json`](/content/project/README) project:

```bash
cd website
npm install
npm run dev
```

`npm run prepare` regenerates `website/docs/content` from repository markdown before `dev` and `build`.

The generated site exposes three main documentation groups:

- product documentation from `docs/*`;
- contributor guides from `docs/contributing/*`;
- package and source-level documentation from `packages/*`.
