# Agent Prompt: Documentation Generation for Nrgy.js

This prompt is intended for an AI agent that will document the source code in
the Nrgy.js project.

---

**Task**: Analyze the provided TypeScript source file and create documentation
for it in Markdown format.

**Execution Rules**:

1. **Placement**: Create a new documentation file in the same folder as the
   source file. The filename should match the source filename but with the `.md`
   extension.
2. **Translation**: If possible, create a second file with a Russian
   translation. Filename: `${filename}.ru.md`.
3. **Documentation Content (English for `.md`, Russian for `.ru.md`)**:

- **Purpose**: Briefly describe the role this file plays.
- **Overview**: Describe the logic and usage context in detail.
- **Conceptual Architecture**: Explain the internal structure and connections
  with other parts of the system (atoms, effects, scopes, etc.).
- **Public API Description**: List exported functions, classes, and types.
  Describe their parameters and return values.
- **Usage Examples**: Write code examples showing typical usage scenarios for
  this module. Examples must be correct and in TypeScript.

4. **Style**:

- Use technical, concise language.
- Maintain consistency in terms: Atom, Effect, Scope, Controller, View Model.
- Follow a structure of level 2 headers (##).

**Input Data**:
[File Path]: {{FILE_PATH}}
[File Content]:

```typescript
{
  {
    FILE_CONTENT
  }
}
```

---
