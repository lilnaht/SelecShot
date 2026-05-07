<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Workstream Status

This file is also being used as the live coordination board for the current multi-agent implementation pass.

## Agent A - Backend, Processing, Security

Status: completed
Worker: Herschel (`019e03cd-91be-75d1-b5a4-e672c68775af`)
Last report: route-level rate limiting/audit/retry draft completed; coordinator completed processor retry/schema metadata and verification.

Scope:
- Implement retry/reprocess support for failed analyses.
- Harden `/api/worker/trigger` with rate limiting and safer request handling.
- Add audit/event hooks where useful.
- Extend processing metadata for progress, invalid files, timing, ZIP size, and operational observability.
- Keep Supabase service-role usage server-only and validate all storage paths.

Files owned:
- `src/app/api/**`
- `src/lib/image-analysis/**`
- `src/lib/audit.ts`
- `src/lib/rate-limit.ts`
- `src/lib/types.ts`
- `supabase/schema.sql`

## Agent B - Dashboard, Results, Upload UX

Status: completed
Worker: Dewey (`019e03cd-930a-7fa1-b93f-4bb342361c6c`)
Last report: upload validation/duplicate/estimate/cancel and dashboard history draft completed; coordinator completed analysis detail UX and verification.

Scope:
- Improve upload validation UX, duplicate detection, estimated processing time, and cancel-safe states.
- Add dashboard filters/search/pagination-like progressive history display.
- Add richer analysis detail UX: all-files table, preview modal, category download actions, and clearer ZIP unavailable state.
- Improve empty/loading/error states for real user workflows.

Files owned:
- `src/components/dashboard/**`
- `src/components/shared/**`
- `src/app/dashboard/**`

## Agent C - Auth, Account, Product, Quality

Status: completed
Worker: Epicurus (`019e03cd-94a3-7631-8639-4bfcc31cb24b`)
Last report: auth recovery and account usage draft completed; coordinator completed tests/CI/docs and verification.

Scope:
- Add password recovery and clearer email confirmation states.
- Improve account/profile page with plan limits and usage.
- Add onboarding/demo/product feedback affordances where they fit without external services.
- Add tests, CI, and deployment/RLS documentation.

Files owned:
- `src/components/shared/auth-form.tsx`
- `src/app/login/**`
- `src/app/register/**`
- `src/app/account/**`
- `src/app/page.tsx`
- `src/app/pricing/**`
- `package.json`
- `.github/**`
- `README.md`
- `next-steps.md`

## Progress Log

- in_progress: Multi-agent assignments created.
- in_progress: Herschel is handling backend/processing/security.
- in_progress: Dewey is handling dashboard/results/upload UX.
- in_progress: Epicurus is handling auth/account/product/quality.
- in_progress: First worker wait cycle timed out; coordinator continues tracking and will integrate completed work as workers report back.
- completed: Epicurus reported auth/account draft; coordinator is validating and completing missing tests/CI/docs.
- completed: Dewey reported upload/dashboard history draft; coordinator is validating and completing analysis detail UX.
- completed: Herschel reported trigger route audit/rate-limit draft; coordinator is completing processor retry/schema support and verification.
- completed: Added category ZIP download route, preview modal, full file table, retry button, processing metrics, audit schema, Vitest tests, CI and deploy/RLS docs.
- verified: `npm run lint` passed.
- verified: `npm test` passed with 4 files and 11 tests.
- verified: `npm run build` passed.
- noted: `npm audit --audit-level=high` returned no high/critical failures, but reported a moderate transitive `postcss` advisory through `next`; `npm audit fix --force` would downgrade Next, so it was not applied.
