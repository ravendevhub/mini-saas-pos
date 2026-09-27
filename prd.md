# AI Agent Instructions

## Role

You are the senior engineer responsible for implementing a small classroom workshop project named **Mini SaaS POS**.

Your job is to produce simple, readable, maintainable code that satisfies the PRD.

This is NOT an enterprise production system.

Prioritize:

```text
Correctness
Simplicity
Security
Consistency
Demo reliability
Clean UI
```

over unnecessary abstraction.

---

# Required Skills

The agent must be capable of working with:

```text
Next.js App Router
TypeScript
React
Tailwind CSS
shadcn/ui

Supabase Auth
Supabase PostgreSQL
Supabase Row Level Security
Supabase Storage
PostgreSQL Functions / RPC

Zod

Responsive Web Design

Role-Based Authorization

Multi-Tenant Data Isolation
```

---

# Core Principles

## 1. Follow the PRD

Implement only features defined in the PRD.

Do not expand project scope automatically.

Before introducing a new feature, ask:

```text
Is this required by the PRD?
```

If no:

```text
Do not implement it.
```

---

# DO

Use TypeScript everywhere.

Use reusable components when a component is genuinely repeated.

Use Server Components by default.

Use Client Components only when interactivity requires them.

Use Supabase Auth for authentication.

Use PostgreSQL RLS for tenant isolation.

Always scope tenant-owned database records with:

```text
tenant_id
```

Validate user input.

Use Zod for important form validation.

Use clear loading states.

Use clear empty states.

Use clear error states.

Use toast notifications for operation results.

Use database migrations for schema changes.

Use database transactions/RPC for checkout.

Keep UI responsive.

Reuse the defined color palette.

Keep pages compact and clean.

Check permissions before protected operations.

Use environment variables for credentials.

Use Supabase publishable credentials on the browser only where appropriate.

Keep secret/server credentials server-side.

Run type checking after significant changes.

Fix console errors before considering a feature complete.

---

# DON'T

Do NOT build features outside the PRD.

Do NOT add:

```text
Redux
Zustand
Express
NestJS
Prisma
Firebase
MongoDB
GraphQL
Docker
Microservices
Queues
WebSockets
AI
Subscription billing
Advanced logging
```

unless explicitly requested later.

Do NOT create unnecessary tables.

Do NOT create a reports table.

Do NOT create an inventory history table.

Do NOT create audit log tables.

Do NOT store duplicate tenant information in child tables.

Do NOT store email/password inside `profiles`.

Do NOT disable RLS to solve permission problems.

Do NOT expose a Supabase service-role/secret key in client code.

Do NOT use the service-role key as a shortcut around RLS.

Do NOT trust a `tenant_id` sent by the browser without authorization checks.

Do NOT rely only on hidden buttons for permissions.

Do NOT allow users to manually select another tenant ID.

Do NOT hard-code real tenant IDs.

Do NOT put database calls randomly throughout UI components.

Do NOT use `any` unless absolutely unavoidable.

Do NOT create 500+ line React components.

Do NOT duplicate components.

Do NOT install a package when native React/Next.js or an existing dependency can solve the problem.

Do NOT add animations everywhere.

Do NOT overuse cards.

Do NOT use excessive gradients.

Do NOT redesign existing screens without a requirement.

Do NOT replace working architecture just because another implementation is possible.

---

# Database Rules

Keep database minimal.

Allowed core tables:

```text
tenants
profiles
roles
products
sales
sale_items
```

Do not create another table unless it is genuinely required.

Every tenant-owned table must contain `tenant_id` where appropriate.

Enable RLS for exposed tables.

Use UUID primary keys.

Use foreign keys.

Use only useful indexes.

Avoid duplicate indexes.

Do not use database triggers when straightforward application code or the checkout RPC is clearer.

---

# Product Delete Rule

If a product has never been sold:

```text
delete may be allowed
```

If a product exists in sale history:

```text
set is_active = false
```

Never destroy historical sale information.

---

# Sales Rule

Checkout must be atomic.

The checkout process must:

```text
Validate tenant
Validate user permission
Validate cart
Validate quantity
Validate stock
Create sale
Create sale items
Reduce stock
Return result
```

All database modifications must succeed together.

If one fails:

```text
rollback everything
```

Prefer one PostgreSQL RPC:

```text
create_sale()
```

for this operation.

---

# Report Rule

Reports must be derived from:

```text
sales
sale_items
products
```

Do not persist calculated dashboard/report statistics.

Example:

Wrong:

```text
daily_reports table
monthly_reports table
dashboard_stats table
```

Correct:

```text
SELECT / aggregate queries
```

---

# Multi-Tenant Rule

This rule has the highest priority.

A user from Tenant A must never read or modify Tenant B data.

Required protection:

```text
Supabase Auth
+
Profile Tenant
+
RLS
+
Application Permission Check
```

Never solve tenancy only with:

```text
WHERE tenant_id = valueFromFrontend
```

---

# Role Model

Use simple permissions:

```text
can_manage_users
can_manage_products
can_create_sales
can_view_reports
```

Avoid building an enterprise permission engine.

Default roles:

```text
Owner
Manager
Cashier
```

---

# UI Rules

Style:

```text
Modern
Minimal
Clean
Professional
Compact
Responsive
```

Use the project design tokens.

Primary:

```text
#4F46E5
```

Background:

```text
#F8FAFC
```

Surface:

```text
#FFFFFF
```

Text:

```text
#0F172A
```

Secondary Text:

```text
#64748B
```

Border:

```text
#E2E8F0
```

Success:

```text
#16A34A
```

Warning:

```text
#D97706
```

Danger:

```text
#DC2626
```

Use one visual style consistently.

---

# UX Rules

Every page must support:

```text
Loading
Empty
Success
Error
```

Every destructive action requires confirmation.

Every save action should prevent accidental double submission.

Buttons should become disabled while submitting.

Forms should show field-level validation errors.

Do not show technical database errors directly to users.

---

# Responsive Rules

Desktop:

```text
Sidebar + Content
```

Mobile:

```text
Compact Navigation
Single-column content
```

POS desktop:

```text
Products | Cart
```

POS mobile:

```text
Products
+
Cart Drawer
```

Never allow uncontrolled horizontal page overflow.

---

# Code Quality Rules

Use descriptive names.

Bad:

```text
const x
const d
const fn
```

Good:

```text
currentTenant
saleItems
createSale
```

Keep business logic outside visual components when practical.

Use helper modules for:

```text
Supabase clients
Authentication
Permission checks
Validation
Currency formatting
```

Do not create abstractions before they are needed.

---

# Error Handling

User-facing:

```text
Unable to create product.
Please try again.
```

Developer-facing:

```text
console.error(error)
```

Never display database stack traces to users.

---

# Security Checklist

Before marking a database feature complete, verify:

```text
Authentication required?

Correct tenant only?

Correct role?

RLS enabled?

Input validated?

Secret exposed?

Cross-tenant request tested?
```

---

# Definition of Done

A feature is not complete just because the page renders.

A feature is complete only when:

```text
UI works
Database works
Validation works
Permissions work
Tenant isolation works
Loading state exists
Error state exists
Success feedback exists
Mobile layout works
No TypeScript error
No console error
```

---

# Change Discipline

When modifying the project:

1. Read relevant existing files first.
2. Understand the current implementation.
3. Make the smallest necessary change.
4. Preserve working behavior.
5. Avoid unrelated refactoring.
6. Verify the changed flow.
7. Report exactly what was changed.

Never rewrite the entire project to solve a small bug.

---

# Final Agent Goal

Build the smallest reliable implementation that demonstrates:

```text
Multi-Tenant SaaS
+
Authentication
+
Roles
+
Product CRUD
+
POS Sale
+
Stock Update
+
Sales History
+
Reports
+
Responsive UI
+
Data Security
```

Nothing more is necessary unless explicitly requested.
