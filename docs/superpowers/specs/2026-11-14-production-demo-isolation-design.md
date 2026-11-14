# Production Demo Isolation Design

## Intent

Keep the local Figma preview available in development while excluding preview routes, seeded records, and mock repositories from production build output.

## Requirements

- Preserve the current Figma screens and local preview behavior. Do not edit Figma or change screen styling.
- Keep ordinary production API behavior unchanged and prevent demo storage or mock responses from being used in production.
- Ensure production output contains no demo-only route chunks or seeded-record markers.
- Use the existing Vite, React, TypeScript, FSD, and `shared/theme` setup without new dependencies.
- Verify with `npm run typecheck`, `npm run build`, and a production asset scan. Do not add or run a test suite.

## Root Cause

The production build replaces `import.meta.env.DEV`, but several shared or production-reachable modules still import demo repositories statically or guard them only with the runtime `isDemoMode()` function. Rollup therefore retains demo fixtures and identifiers in chunks reachable from product routes. Examples include the VM network page, shared Serverless shell, home page, and Apps creation modules.

## Approaches

1. **Production aliases for demo modules:** quickly replaces demo repositories at build time, but creates a second module-resolution behavior and can leave production components coupled to stub exports.
2. **Dev-only code boundaries:** guard demo behavior at compile-time and load demo repositories only from development-only dynamic imports or development-only routes. This keeps FSD modules and production API behavior explicit, so this is the selected approach.
3. **Separate development and production app entry points:** provides a strong boundary but duplicates router/bootstrap composition and is broader than the observed leak.

## Scope

Audit the production entry graph, remove static demo repository imports from production-reachable modules, make demo-mode branches statically removable, and keep local-only behavior behind `import.meta.env.DEV`. Build checks must prove the previously observed VM, Database, Apps, team, and Serverless fixture markers are absent from `dist`.

## Non-goals

- No Figma edits, visual redesign, style changes, backend changes, or API contract changes.
- No changes to the development preview's seeded data or user flows.
