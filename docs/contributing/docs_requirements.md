# Documentation Requirements for Developers

To ensure high quality and consistency of documentation in the Nrgy.js project,
all developers must follow these rules when adding or changing functionality.

## General Rules

1. **Documentation Placement**: Source code documentation files should be
   placed in the same folder as the source file itself.

- Example: `packages/core/src/reactivity.ts` ->
  `packages/core/src/reactivity.md`.

2. **Localization**: Documentation must be translated into
   English and Russian. AI translation is acceptable.

- The translation should be placed in a separate file with the locale as a
  suffix.
- Example: `packages/core/src/reactivity.ru.md`.

3. **Format**: Documentation is written in Markdown format.

4. **No `index.ts` File Articles**: Do not create standalone documentation
   files for `index.ts` source files.

- Public package entry points such as `index.ts` must be documented in the
  package-level `README.md` or other package-level documentation instead.

## Article Structure for a File (Module)

Each article should contain the following sections:

1. **Purpose**: A brief description of what problem the file/module solves.
2. **Overview**: A more detailed description of the logic and context of use.
3. **Conceptual Architecture**: Description of internal mechanisms and
   relationships with other parts of the system.
4. **Public API Description**: A list of exported functions, classes, and types
   with descriptions of parameters and return values.
5. **Usage Examples**: Practical code examples (Code Blocks) demonstrating API
   usage.

## Article Structure for a Package

Each package should have a `README.md` file in its root (usually next to
`index.ts` or in the root of the package folder) or an `index.md` file in the
general `docs` folder, containing:

1. **Package Purpose**: Why this package is needed.
2. **Overview**: Main ideas and principles.
3. **Package Installation**: Commands for installation (npm/yarn/pnpm).
4. **Conceptual Architecture**: How the package is organized internally.
5. **Feature Documentation**: Links to key modules or a summary description.
6. **Usage Examples**: Integration examples.

## Writing Style

- Use clear and concise technical language.
- Code in examples must be functional and follow project standards.
- Use `inline code` formatting for API function and parameter names.
