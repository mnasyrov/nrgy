# Website Guide

This website is a standalone VitePress project under `website/`. It is not part
of the monorepo workspaces and does not introduce any workspace-level package
links.

## Commands

```bash
cd website
npm install
npm run dev
npm run build
```

## Generated Inputs

`npm run prepare` copies these repository sources into
`website/docs/content`:

- top-level project markdown such as `README.md` and `CHANGELOG.md`;
- repository docs under `docs/`;
- package documentation under `packages/*/README*.md`;
- source-level package docs under `packages/*/src/**/*.md`.

All copied content and VitePress outputs are ignored by git in
`website/.gitignore`.
