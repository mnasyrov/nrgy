# Contributing

## Purpose

This section explains how to contribute changes to the Nrgy.js repository. It
collects the repository rules for documentation, coding style, workflow, and
automated contributors.

## Who Should Read This

- contributors updating source code, tests, or docs;
- package authors working inside the monorepo;
- automation and AI agents generating documentation or code changes.

## Contents

- [Documentation Requirements](./docs_requirements.md): mandatory structure and
  placement rules for source and package documentation.
- [Documentation Prompt](./docs_prompt.md): prompt template for agents
  generating module documentation.
- [Coding Style](./coding_style.md): practical conventions derived from the
  current codebase.
- [Development Workflow](./development_workflow.md): commands, validation
  steps, and repository workflow.
- [Agent Guide](./agent_guide.md): expectations for automated contributors and
  documentation agents.

## Notes

- When adding or changing source files, update colocated documentation in the
  same directory.
- Do not create standalone documentation for `index.ts`; document package entry
  points in package-level `README.md` files.
- Keep English and Russian documentation in sync.
