# Release Workflow

## Purpose

This guide describes how Nrgy.js packages are versioned and published. Most
contributors and agents will not need to run these commands — releases are
typically driven by maintainers.

## Release-Relevant Files

- Root [CHANGELOG.md](../../CHANGELOG.md) records project-level changes.
- Per-package `CHANGELOG.md` files track package-level releases.
- Package names and install commands must come from current `package.json`
  files.
- Versioning rules live in [lerna.json](../../lerna.json).
- Release commands live in the root [package.json](../../package.json).

## Release Preparation

1. Make sure the working tree contains only the intended changes.
2. Run `npm run check`.
3. Run `npm run test`.
4. Run `npm run build`.
5. Verify that the relevant docs and changelog entries are up to date.

## Versioning

Use the dry run first:

```bash
npm run preview:new-version
```

Create versions only after the dry run looks correct:

```bash
npm run new-version
```

- `preview:new-version` runs `lerna version --dry-run`.
- `new-version` runs `lerna version` with conventional commits enabled.
- Before versioning, the `preversion` hook runs `npm run check`,
  `npm run build`, and `npm run test`, then stages all changes with
  `git add --all`.

## Publishing

After the packages are versioned and the release commit is ready, publish from
the already versioned packages:

```bash
npm run new-publish
```

- `new-publish` runs `lerna publish from-package`.
- Package releases are based on the versions already written into the package
  manifests.

## Release Notes and Validation

- Review the root `CHANGELOG.md` and the package `CHANGELOG.md` files after
  versioning.
- Confirm that generated docs and package READMEs still match the released API.
- If the website docs changed, run the site build from
  [website/package.json](../../website/package.json) before publishing.
