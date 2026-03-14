# Developer Documentation

## Purpose

This section contains the development guides, documentation standards, and
agent-facing instructions used in the Nrgy.js repository.

## Overview

The materials in `docs/developers` define how source code should be structured,
documented, formatted, and maintained. They are intended for:

- package authors working inside the monorepo;
- contributors updating source code and tests;
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

## Usage Notes

- When adding or changing source files, update colocated documentation in the
  same directory.
- Do not create standalone documentation for `index.ts`; document package entry
  points in package-level `README.md` files.
- Keep English and Russian documentation in sync.
