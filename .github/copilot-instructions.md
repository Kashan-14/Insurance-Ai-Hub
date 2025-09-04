# Copilot & Agent Rules for Full Stack Development

## Mandatory Rules for All AI Agents

1. **Data Consistency Is Critical**
   - Any change to frontend data structures (fields, types, names) must be immediately reflected in backend API handlers and database models.
   - Never ignore mismatches between frontend, backend, and database schemas. If a change is detected, update all layers before proceeding.

2. **Central Contract Reference**
   - Always check and update the shared contract file (e.g., `src/types/`, `api/schema.ts`, or `CONTRACT.md`) when modifying data structures.
   - Agents must reference this contract before generating code for any layer.

3. **Centralized Memory Bank Reference (MANDATORY)**
   - Agents must always load and cross-reference all files in `memory/docs/*.md` before any major change, including:
     - `memory/docs/product_requirements.md`
     - `memory/docs/architecture.md`
     - `memory/docs/technical.md`
     - `memory/tasks/tasks_plan.md`
     - `memory/docs/development_logs.md`
   - All requirements, architecture, technical standards, and development logs must be sourced from the centralized memory bank.
   - If any memory doc is missing or outdated, halt development and request resolution before proceeding.
   - All decisions and changes must be logged in `memory/docs/development_logs.md`.
   - Use file reference syntax `@filename` and prioritize referenced files for every workflow step.

3. **Change Propagation Checklist**
   - For every new or changed field, update:
     - Frontend components/forms
     - Backend request handlers
     - Database models/schemas
     - Integration tests
   - Document changes in a changelog or summary file if possible.

4. **Testing Is Required**
   - Run integration tests after any schema or contract change to verify end-to-end data flow.
   - Use mock data that matches the latest frontend structure.

5. **No Skipping Steps**
   - Agents must not skip updating any layer. If a required update is missing, halt development and prompt for resolution.

6. **Project Conventions**
   - Use camelCase for all field names.
   - API responses must match frontend expectations exactly.
   - Database migrations are required for any schema change.

## Workflow & Execution Rules (from development-rules.md)

- Follow workflow steps in `project_rules/plan.md`, `project_rules/implement.md`, and `project_rules/debug.md`:
   - Plan: analyze requirements, break into subtasks, estimate effort
   - Implement: write modular code, follow technical standards, add comments
   - Debug: check logs, validate requirements, suggest fixes
- Execute in sandbox mode and iterate on errors (max 3 iterations).
- Enforce coding standards from `memory/docs/technical.md` and use ESLint (auto-fix lint errors).
- Require modular code, separation of concerns (frontend: `src/components/`, backend: `src/api/`, database: `src/db/`).
- Use dependency injection and avoid global variables.
- Proactively check for errors (null pointer, missing imports, async/await mismatch).
- Validate against `memory/docs/technical.md`.
- Analyze logs and suggest fixes with explanations, referencing `memory/docs/development_logs.md`.
- Optimize responses for conciseness and load only relevant files.
- Use platform features: Windsurf (cascade, @notation), Cursor (workspace_prompts), Copilot (copilot-instructions.md), Replit (ghostwriter), Cody (semantic_search).
- Document code, update logs, and generate shareable workflows (`project_rules/*.md`).
- Adapt to project size and use large project index (`memory/docs/*.md`).
- Enforce security standards from `memory/docs/technical.md`, sanitize inputs, use HTTPS, avoid hardcoded secrets, and integrate vulnerability scans (aikido).
- Auto-document code, update README, and log decisions in development logs.

## Workflows Development Rules (Mandatory)

- Reference and prioritize files in `memory/docs/*.md` for requirements, architecture, technical standards, and development logs.
- Use file reference syntax: `@filename` and cross-reference memory docs for context.
- Follow workflow steps in `project_rules/plan.md`, `project_rules/implement.md`, and `project_rules/debug.md`:
   - Plan: analyze requirements, break into subtasks, estimate effort
   - Implement: write modular code, follow technical standards, add comments
   - Debug: check logs, validate requirements, suggest fixes
- Execute in sandbox mode and iterate on errors (max 3 iterations).
- Enforce coding standards from `memory/docs/technical.md` and use ESLint (auto-fix lint errors).
- Require modular code, separation of concerns (frontend: `src/components/`, backend: `src/api/`, database: `src/db/`).
- Use dependency injection and avoid global variables.
- Proactively check for errors (null pointer, missing imports, async/await mismatch).
- Analyze logs and suggest fixes with explanations, referencing `memory/docs/development_logs.md`.
- Optimize responses for conciseness and load only relevant files.
- Use platform features: Windsurf (cascade, @notation), Cursor (workspace_prompts), Copilot (copilot-instructions.md), Replit (ghostwriter), Cody (semantic_search).
- Document code, update logs, and generate shareable workflows (`project_rules/*.md`).
- Adapt to project size and use large project index (`memory/docs/*.md`).
- Enforce security standards from `memory/docs/technical.md`, sanitize inputs, use HTTPS, avoid hardcoded secrets, and integrate vulnerability scans (aikido).
- Auto-document code, update README, and log decisions in development logs.

## Example Workflow

1. Frontend adds a new field `userPhone`.
2. Update shared type/interface: `src/types/User.ts`.
3. Update backend API handler: `api/user.ts`.
4. Update database model: `db/models/User.js`.
5. Run migration: `npm run migrate`.
6. Update integration tests: `tests/integration/user.test.js`.

## Enforcement
- These rules are mandatory. Agents must not ignore them during development.
- If a rule is violated, halt and request clarification or correction before continuing.

## Scope & Context Protection
- Agents must not breach project scope or context. All changes must align with requirements and technical docs.
- If any ambiguity or risk of scope creep is detected, halt and request clarification before proceeding.

---

_This file must be referenced by all agents and Copilot during development. Do not bypass or ignore these instructions._
