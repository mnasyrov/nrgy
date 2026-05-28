# Agent Guide

Entry point for automated contributors (AI agents, scripted bots) working in
the Nrgy.js repository. Human contributors should also skim this once.

## What This Repo Is

Nrgy.js is a TypeScript monorepo (Lerna + npm workspaces) implementing a
reactive runtime with MVC/MVVM primitives. Published packages live under
`packages/*`:

- `@nrgyjs/core` — atoms, effects, scopes, controllers, view models.
- `@nrgyjs/react` — React hooks and HOCs for atoms and controllers.
- `@nrgyjs/ditox`, `@nrgyjs/ditox-react` — DI integrations.
- `@nrgyjs/rxjs`, `@nrgyjs/rx-effects` — RxJS interop.

`docs/*` holds product and contributor documentation. `website/*` is the
generated documentation site (do not edit `website/docs/content/*` by hand).
`benchmarks/*` holds local performance scenarios.

## Commands You Will Actually Use

```bash
npm install           # bootstrap workspaces
npm run format        # biome --write
npm run check         # biome + tsc --noEmit (run before reporting done)
npm run test          # vitest (single run)
npm run build         # tsdown for all packages
```

For website work, see [docs/contributing/development_workflow.md](./docs/contributing/development_workflow.md).
For release commands, see [docs/contributing/release_workflow.md](./docs/contributing/release_workflow.md).

## Golden Rules

1. **Colocate docs with source.** A change to `packages/core/src/foo.ts`
   means updating `foo.md` and `foo.ru.md` in the same folder. Tests
   (`foo.test.ts`) live next to the source too.
2. **Never write standalone docs for `index.ts`.** Document package entry
   points in the package-level `README.md` instead.
3. **Keep `.md` and `.ru.md` in sync.** Every English doc has a Russian
   sibling. AI translation is fine; drift is not.
4. **Source of truth lives in `docs/*`, not `website/docs/content/*`.**
   The website generator regenerates content from `docs/*`.
5. **Public API changes go together with tests + module doc + package
   README.** Do not split these into separate PRs.
6. **`@nrgyjs/core` is framework-agnostic.** Do not introduce React, RxJS,
   or DOM dependencies into it.

Full ruleset for documentation structure:
[docs/contributing/docs_requirements.md](./docs/contributing/docs_requirements.md).

## Working Style

- Prefer small targeted changes over broad rewrites.
- Preserve package names and public exports unless the task says otherwise.
- Respect existing naming, formatting, and lifecycle conventions
  (`destroy()`, `Scope`, `unsubscribe()`).
- If you skip validation (`check`/`test`/`build`), say so explicitly in the
  final report.

## Where To Look Next

- [docs/contributing/README.md](./docs/contributing/README.md) — index of
  contributor guides.
- [docs/contributing/coding_style.md](./docs/contributing/coding_style.md)
  — project-specific patterns (Atom, Effect, Scope, Controller).
- [docs/contributing/development_workflow.md](./docs/contributing/development_workflow.md)
  — daily flow, website build.
- [docs/contributing/docs_requirements.md](./docs/contributing/docs_requirements.md)
  — required structure for module and package documentation.
- [docs/contributing/release_workflow.md](./docs/contributing/release_workflow.md)
  — versioning and publishing.
- [docs/README.md](./docs/README.md) — full product documentation index.
