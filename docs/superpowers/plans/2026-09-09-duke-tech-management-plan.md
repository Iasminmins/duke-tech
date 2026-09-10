# Duke Tech Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-shaped Duke Tech management slice without changing the existing landing page.

**Architecture:** A standalone React/Vite app in `admin-app/` uses Supabase Auth, Postgres, Storage, Realtime, and RLS. The app owns `/admin/*` and `/acompanhar/*`; the existing root `index.html` remains untouched.

**Tech Stack:** React, TypeScript, Vite, React Router, Supabase JS, Zod, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-duke-tech-management-design.md`

## Global Constraints

- Never modify `index.html`.
- Never expose service-role or secret Supabase keys to the browser.
- Enable RLS on every exposed application table.
- Never expose CPF, device passwords, internal notes, costs, or other customers publicly.
- Use UUID identifiers and cryptographically random public tracking codes.
- Every new behavior gets a failing test before implementation.

---

### Task 1: Application scaffold and landing regression guard

**Files:**
- Create: `admin-app/package.json`, `admin-app/tsconfig.json`, `admin-app/vite.config.ts`, `admin-app/index.html`
- Create: `admin-app/src/main.tsx`, `admin-app/src/app/App.tsx`, `admin-app/src/styles/tokens.css`
- Create: `admin-app/tests/landing-regression.test.ts`
- Modify: `.gitignore`
- Test: `admin-app/tests/landing-regression.test.ts`

**Interfaces:**
- Produces a standalone app entry point and an automated check that the root landing file is unchanged.

- [ ] Capture the current SHA-256 of `index.html` and write the regression test that compares it after build-related operations.
- [ ] Run the regression test and verify it fails because the test harness is not configured.
- [ ] Add the minimal Vite/React scaffold and test configuration without editing `index.html`.
- [ ] Run the regression test and verify it passes.
- [ ] Commit `chore: scaffold isolated duke tech admin app`.

### Task 2: Supabase client and authentication shell

**Files:**
- Create: `admin-app/src/lib/supabase.ts`, `admin-app/src/lib/env.ts`
- Create: `admin-app/src/auth/AuthProvider.tsx`, `admin-app/src/auth/ProtectedRoute.tsx`
- Create: `admin-app/src/pages/LoginPage.tsx`, `admin-app/src/pages/AdminLayout.tsx`
- Create: `admin-app/src/components/ui/LoadingState.tsx`, `admin-app/src/components/ui/ErrorState.tsx`
- Test: `admin-app/src/auth/auth.test.tsx`

**Interfaces:**
- `AuthProvider` exposes `{ session, profile, loading, signIn, signOut }`.
- `ProtectedRoute` redirects unauthenticated users to `/admin/login`.

- [ ] Write tests for redirecting unauthenticated users and rendering authenticated children.
- [ ] Run the tests and verify the missing provider/guard failure.
- [ ] Implement environment validation, Supabase browser client, auth provider, login form, logout, and protected layout.
- [ ] Run unit tests and verify all authentication tests pass.
- [ ] Commit `feat: add protected admin authentication shell`.

### Task 3: Database schema, RLS, and seed-free migrations

**Files:**
- Create: `supabase/config.toml`
- Create via Supabase CLI command: `supabase migration new create_duke_tech_core` (the CLI-generated timestamped file becomes `supabase/migrations/*_create_duke_tech_core.sql`)
- Create: `supabase/tests/rls_core.sql`
- Test: `supabase/tests/rls_core.sql`

**Interfaces:**
- Tables and enums follow the exact names in the design spec.
- Public read surface returns only safe tracking fields.

- [ ] Write SQL assertions for role enum, unique phone index, random public code, status history, RLS enablement, and public-field projection.
- [ ] Run the SQL test against the isolated Duke Tech project and verify failure before migration exists.
- [ ] Generate the migration with `supabase migration new`, then implement tables, indexes, timestamps, status transition function, private photo bucket, and RLS policies.
- [ ] Apply the migration to the Duke Tech project, run the SQL assertions, and run Supabase security advisors.
- [ ] Commit `feat: add duke tech core schema and rls`.

### Task 4: Customers and devices

**Files:**
- Create: `admin-app/src/features/customers/customerSchema.ts`, `customerRepository.ts`, `CustomersPage.tsx`, `CustomerDetailPage.tsx`
- Create: `admin-app/src/features/devices/deviceSchema.ts`, `deviceRepository.ts`, `DevicesPage.tsx`, `DeviceForm.tsx`
- Create: `admin-app/src/components/forms/FieldError.tsx`, `ConfirmDialog.tsx`
- Test: `admin-app/src/features/customers/customerSchema.test.ts`, `admin-app/src/features/devices/deviceSchema.test.ts`

**Interfaces:**
- Customer form accepts name, phone, WhatsApp, email, optional CPF, address, and notes.
- Device form accepts customer, brand, model, color, IMEI/serial, sensitive password, condition, accessories, problem, and dates.

- [ ] Write validation tests for required names/phones, duplicate-safe phone normalization, and device/customer relationships.
- [ ] Run tests and verify expected failures.
- [ ] Implement repositories, forms, searchable lists, detail views, archive confirmation, loading states, and error recovery.
- [ ] Run tests and verify customer/device behavior.
- [ ] Commit `feat: add customer and device management`.

### Task 5: Work orders, photos, and status history

**Files:**
- Create: `admin-app/src/features/work-orders/workOrderSchema.ts`, `workOrderRepository.ts`
- Create: `admin-app/src/features/work-orders/WorkOrdersPage.tsx`, `NewWorkOrderPage.tsx`, `WorkOrderDetailPage.tsx`
- Create: `admin-app/src/features/work-orders/PhotoUploader.tsx`, `StatusTimeline.tsx`, `StatusBadge.tsx`
- Test: `admin-app/src/features/work-orders/workOrderSchema.test.ts`, `statusTransition.test.ts`

**Interfaces:**
- `createWorkOrder(input)` creates a work order and first status event.
- `changeWorkOrderStatus(id, nextStatus, note)` validates and records an immutable status event.
- `uploadWorkOrderPhotos(orderId, files)` validates JPG/PNG/WEBP, size limits, category, and visibility.

- [ ] Write tests for the six-step creation validation, allowed status values, and rejected invalid transitions.
- [ ] Run tests and verify failures.
- [ ] Implement wizard, repository mutations, photo preview/compression/upload, timeline, filters, and detail actions.
- [ ] Run unit/integration tests and verify no sensitive fields enter public projections.
- [ ] Commit `feat: add repair work orders and photos`.

### Task 6: Public tracking and realtime updates

**Files:**
- Create: `admin-app/src/features/tracking/trackingRepository.ts`, `PublicTrackingPage.tsx`
- Create: `admin-app/src/features/tracking/PublicStatusProgress.tsx`, `PublicPhotoGallery.tsx`
- Test: `admin-app/src/features/tracking/publicProjection.test.tsx`, `realtimeTracking.test.tsx`

**Interfaces:**
- `getPublicTracking(code)` returns only the safe projection.
- `subscribeToTracking(orderId, callback)` listens to status and public-photo changes and returns an unsubscribe function.

- [ ] Write tests proving sensitive fields are absent and realtime updates replace the visible status.
- [ ] Run tests and verify failures.
- [ ] Implement public page, progress bar, timeline, public message, gallery, WhatsApp link builder, privacy notice, not-found state, and realtime subscription.
- [ ] Run tests and verify tracking behavior.
- [ ] Commit `feat: add public repair tracking`.

### Task 7: End-to-end acceptance and deployment wiring

**Files:**
- Create: `admin-app/e2e/repair-flow.spec.ts`, `admin-app/.env.example`, `admin-app/README.md`
- Create: `vercel.json` or equivalent host rewrite configuration after confirming the current hosting provider
- Modify: `.gitignore`
- Test: `admin-app/e2e/repair-flow.spec.ts`

**Interfaces:**
- `/admin/login` protects all admin routes.
- `/acompanhar/:codigo` is public and isolated.
- `/` still serves the original landing page.

- [ ] Write the end-to-end flow for login → customer → device → work order → photo → status → public tracking.
- [ ] Run it against the local preview and verify the expected initial failure.
- [ ] Add route rewrites and environment documentation without changing `index.html`.
- [ ] Run unit, integration, build, browser, RLS, advisor, and landing-hash checks.
- [ ] Commit `test: verify duke tech repair flow and deployment boundaries`.
