# Duke Tech Management System Design

**Date:** 2026-09-09  
**Status:** Approved architecture; implementation begins with Phase 1

## Goal

Create a separate management application for Duke Tech while preserving the existing public landing page byte-for-byte. The first delivery is a production-shaped vertical slice covering authentication, staff roles, clients, devices, repair work orders, photos, status history, and public tracking.

## Non-negotiable constraint

`index.html` is the current landing page and must not be modified. The new application lives in new files and uses `/admin/*` and `/acompanhar/*` routes. No existing links, catalog content, WhatsApp behavior, animations, or visual structure may change.

## Recommended architecture

Use a standalone React + TypeScript + Vite application under `admin-app/`, backed by the existing Supabase project `xhyfzgxpouyeroaedeco`. The app is deployed alongside the static landing page with host-level rewrites for `/admin/*` and `/acompanhar/*`; the root path continues to serve the original `index.html`.

Supabase provides Auth, Postgres, Storage, Realtime, and Row Level Security. The browser receives only the public project URL and publishable key. Service-role credentials never enter the client bundle.

## Routes

Public:

- `/` — untouched existing landing page.
- `/acompanhar/:codigo` — public, privacy-safe repair tracking.

Protected:

- `/admin/login`
- `/admin`
- `/admin/clientes`
- `/admin/clientes/:id`
- `/admin/aparelhos`
- `/admin/comandas`
- `/admin/comandas/nova`
- `/admin/comandas/:id`

Phase 2 adds products, inventory, sales, finance, reports, users, and settings.

## Domain model

Phase 1 tables:

- `profiles`: one-to-one with `auth.users`, role, name, active flag.
- `customers`: contact details, optional CPF, address, notes, archived timestamp.
- `devices`: customer, brand, model, color, IMEI/serial, sensitive access password, condition, received accessories, reported problem, dates.
- `work_orders`: public code, customer, device, assigned technician, service request, diagnosis, quote, discount, final amount, priority, deadline, current status, internal notes, timestamps.
- `work_order_status_history`: immutable status events with actor, note, and timestamp.
- `work_order_photos`: storage object path, category, public flag, uploader, timestamp, soft-delete timestamp.

All domain tables have UUID primary keys, `created_at`, `updated_at`, and `archived_at` where archival applies. Public codes use cryptographically random values and are indexed. Sensitive fields are never selected by the public tracking query.

## Access model

- Administrator: all Phase 1 records and role management later.
- Employee: create and manage customers, devices, and work orders.
- Technician: only assigned work orders; can add diagnosis, photos, and status updates.
- Anonymous public viewer: can read only the safe projection for one valid public code.

RLS is enabled on every exposed table. Authorization uses a server-owned role in `profiles` or `app_metadata`; user-editable metadata is not used for permissions. Public tracking uses a narrowly scoped RPC or view with only approved fields and `security_invoker` where supported.

## UX and visual system

The admin application uses a dark operational workspace: deep charcoal surfaces, neon blue action color, restrained gold accent, white text, soft borders, high contrast, compact tables, and responsive cards. It is a tool, not a marketing page. The shell has a collapsible sidebar, header with global search and account menu, breadcrumbs, primary action, status badges, skeletons, empty states, toasts, error recovery, and keyboard-accessible controls.

The public tracking page uses the Duke Tech identity but exposes only customer-safe content: order number, device model, status, progress, dates, public message, and public photos. It has no CPF, device password, internal notes, cost data, or cross-customer information.

## Data flow

1. Authenticated staff sign in through Supabase Auth.
2. Route guard loads the session and profile role.
3. Staff create a customer, then a device, then a work order through validated forms.
4. Work-order status changes insert an immutable history event and update the current status in one transaction.
5. Photos upload to a private bucket with metadata; public photos are exposed through signed URLs or a safe public policy.
6. Public tracking subscribes to Realtime changes for the single work order and refreshes its safe projection.

## Error and loading behavior

Every route includes loading skeletons, empty states, inline validation, retryable connection errors, success feedback, and destructive-action confirmation. Mutations are disabled while pending and report actionable errors. Forms preserve entered values when a request fails.

## Testing strategy

- Unit tests for validation, public-field projection, status transitions, role predicates, and public-code generation.
- Integration tests against a local Supabase instance or isolated test project for RLS and mutation flows.
- Browser smoke tests for login, customer/device/work-order creation, photo upload, status change, public tracking, and realtime refresh.
- Regression check that `index.html` hash and contents are unchanged.

## Delivery phases

1. Phase 1: foundation and repair vertical slice described above.
2. Phase 2: products, stock movements, sales, payments, and receipt generation.
3. Phase 3: finance, reports, users, settings, WhatsApp message builders, and exports.
4. Phase 4: deployment hardening, monitoring, LGPD documentation, backups, and end-to-end acceptance.

