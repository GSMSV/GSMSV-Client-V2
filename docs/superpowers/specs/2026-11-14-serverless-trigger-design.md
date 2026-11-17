# Serverless Trigger Flow Design

## Intent

Make the existing local Serverless demo trigger page follow the HTTP and Cron add flows represented by the connected Figma file. The controls must use local demo state only and keep the existing screen layout and design tokens.

## Goals

- Add an HTTP Trigger with a method selection. A function can have one HTTP Trigger.
- Add Cron Triggers with a five-field expression, a fixed `Asia/Seoul` timezone, a next-run preview, inline recovery for invalid expressions, and a five-minute minimum interval. A function can have up to three Cron Triggers.
- Route the existing single `Trigger 추가` action to a type-specific dialog using the current trigger limits. Figma has separate HTTP and Cron dialog states, with no standalone type chooser.
- Store valid changes in the existing browser-backed demo state and present Cron entries in a human-readable table and function summary.

## Non-goals

- Real API calls, cron scheduler execution, or backend validation.
- Changes to the Figma file, page layout, or shared design system.
- Changes to Serverless code execution, deployment, variables, or destructive dialogs.

## Constraints

- Frontend only; local demo fixtures in development mode.
- Reuse the existing FSD entity/page/feature boundaries, shared styled-component tokens, and controls.
- Preserve a deterministic demo clock matching the Figma examples.
- Do not add or run tests for this task; run typecheck, build, and diff checks.

## Approaches

1. Add a separate trigger-type chooser before the forms. This is easy to understand but introduces a state not shown in Figma.
2. Route the existing CTA to the next available trigger type based on the Figma limits. This keeps the single CTA and reaches both exact dialogs by adding or removing an existing trigger.
3. Add type-specific buttons to the page. This makes both forms directly reachable but changes the Figma layout.

## Decision

Use approach 2. Prefer HTTP while the function has no HTTP Trigger; after one exists, open Cron while fewer than three Cron Triggers exist. If HTTP is present and the Cron limit is reached, disable the CTA. Removing the HTTP Trigger makes the HTTP dialog available again.

## Implementation details

- Keep Cron parsing, interval validation, next-run calculation, and labels in the `entities/serverless` model.
- Compose the type-specific dialog from the existing Serverless page using a feature-level UI component.
- Validate limits again in the entity mutation so invalid calls cannot persist demo state.
- Migrate only the known seeded legacy labels (`POST 요청 시`, `매일 오전 9:00`) to canonical method/expression values.
