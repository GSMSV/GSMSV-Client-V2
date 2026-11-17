# Serverless Trigger Flow Plan

## Files

- `src/entities/serverless/model/cron.ts`: parse five-field expressions, enforce the minimum interval, calculate a next-run preview in Asia/Seoul, and format supported labels.
- `src/entities/serverless/model/demoServerless.ts` and `src/entities/serverless/index.ts`: canonicalize the known seed values and enforce one HTTP / three Cron limits for local mutations.
- `src/features/serverless/manage-triggers/ui/TriggerDialog.tsx` and `index.ts`: render the Figma-aligned HTTP and Cron dialogs, including invalid and too-frequent Cron recovery.
- `src/pages/serverless/ServerlessTriggersPage.tsx`: route the existing CTA to the next available type, present formatted schedules, and submit or cancel the dialog.
- `src/pages/serverless/routes.tsx`: connect the dialog submission to the local demo entity and display canonical summaries.

## Steps

1. Add the pure Cron parser, five-minute interval validation, Asia/Seoul next-run preview, and schedule labels; check TypeScript types.
2. Add the HTTP/Cron dialog feature using existing shared controls and design tokens; keep invalid and under-five-minute submissions open and disabled.
3. Add domain-level trigger limits and migrate only known seeded schedule labels; connect page routes and summary formatting.
4. Run `npm run typecheck`, `npm run build`, and `git diff --check`; inspect the production bundle to confirm the development fixture remains excluded.
