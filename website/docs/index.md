---
layout: home

hero:
  name: Nrgy.js
  text: Documentation Website
  tagline: VitePress portal for package APIs, developer guides, and source-level module docs.
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
    details: The website mirrors the markdown already maintained in the repository, so package and developer docs stay in one place.
  - title: Package-Centric Navigation
    details: Core, React, Ditox, RxJS, and rx-effects docs are grouped into a dedicated sidebar instead of scattered README links.
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
