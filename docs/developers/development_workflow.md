# Development Workflow

## Purpose

This guide describes the common development workflow for working inside the
Nrgy.js monorepo.

## Repository Layout

- `packages/*`: publishable packages.
- `docs/*`: project, package, and developer-facing documentation.
- `benchmarks/*`: local benchmark scenarios.

## Common Commands

```bash
npm install
```

```bash
npm run format
```

```bash
npm run check
```

```bash
npm run test
```

```bash
npm run build
```

## Expected Flow for Source Changes

1. Update the source file and colocated tests.
2. Update colocated documentation for the changed module.
3. Update the package `README.md` if the public API or usage story changed.
4. Run `npm run check`.
5. Run `npm run test` for behavioral changes.

## Documentation Workflow

- Source module docs live next to source files.
- Package overviews live in package-level `README.md` files.
- Russian translations use the `.ru.md` suffix.
- `index.ts` files must be documented through package README files rather than
  standalone `index.md` pages.

## Release-Relevant Files

- Root [CHANGELOG.md](../../CHANGELOG.md) records project-level changes.
- Package `CHANGELOG.md` files track package-level releases.
- Package names and install commands must come from current `package.json`
  files.
