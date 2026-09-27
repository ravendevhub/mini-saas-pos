# Mini SaaS POS - Master Project Rules & Guidelines

These rules apply to all AI agent operations within this workspace. They are derived directly from the project PRD and are strictly enforced.

---

## 1. Core Mission & Philosophy

- **Project**: **Mini SaaS POS** (Classroom workshop demonstration project).
- **Core Values**: Correctness, Simplicity, Security, Consistency, Demo reliability, Clean UI.
- **Scope Limit**: Build strictly according to the PRD. Do not introduce enterprise patterns, unnecessary abstractions, or unrequested features.

---

## 2. Code Quality & Craftsmanship Standards (STRICT)

### Zero Code Comments Rule
- **DO NOT write code comments**: Avoid inline comments, block comments, JSDoc/docstrings, or explanatory notes inside code files.
- **Self-Documenting Code**: Code must be clear, clean, and self-documenting through precise variable and function naming.
- **Clean Source**: Keep codebases pristine without noisy, conversational, or redundant comments.

### No Half-Baked or Rushed Code (Zero Shortcuts)
- **NEVER write placeholder or mock implementations**: Do not leave `// TODO: implement later`, fake stub returns, or dummy bypasses.
- **Complete End-to-End Implementation**: Every function, Server Action, component, and query must be written completely, robustly, and tested.
- **Strict Typing**: Zero `any` types. All database entities, API payloads, props, and server actions must have complete TypeScript interfaces.
- **Comprehensive Edge Case Handling**: Explicitly handle zero-state, boundary conditions, empty carts, out-of-stock cases, and null/undefined values.

---

## 3. UI Aesthetics, Microcopy & Human-Centered Design

### Anti-AI-Slop & Real-World Utility (CRITICAL)
- **DO NOT create "AI-looking" interfaces**:
  - No futuristic glowing borders, iridescent or rainbow gradients, dark-space glassmorphism, floating decorative spheres, or unprompted novelty animations.
  - No crypto/cyberpunk styling. This is a practical, grounded retail/hospitality POS application used in busy shops.
- **Solid, Crisp, High-Utility Aesthetics**:
  - Crisp 1px borders (`border-slate-200`) on white surfaces (`bg-white`).
  - Subtle micro-elevation (`shadow-sm`) only where separation is needed; flat or near-flat design elsewhere.
  - High information density: cashiers and managers need to scan 15–30 items quickly without excessive scrolling.

### Pragmatic Microcopy & Real-World Business Text
- **NO marketing buzzwords or AI fluff**:
  - Banned: "Unlock the revolutionary future of next-gen smart retail commerce", "AI-powered supercharged inventory", "Step into tomorrow".
- **Short, Direct, Pragmatic Text**:
  - Buttons: "New Sale", "Add Product", "Save Changes", "Delete Product", "Charge $15.00", "Cancel".
  - Empty states: "No products in catalog. Add your first item." (Simple, clear, actionable).
  - Validation messages: "Price must be greater than 0.", "SKU already exists.", "Stock cannot be negative."
  - Toast alerts: "Sale recorded successfully.", "Product archived.", "Failed to update stock."

### Precise Spacing & Padding System (Strict Density)
- **Card & Container Padding**:
  - Compact cards/panels: `p-3` to `p-4` (never use oversized `p-10` or `p-12` on POS workflows).
  - Main page margins: `p-4` on mobile, `p-6` on desktop.
- **List & Table Spacing**:
  - Table rows: Compact vertical padding (`py-2.5` to `py-3`) for quick multi-row scanning.
  - Grid gaps: `gap-3` or `gap-4` between product cards.
- **Form Spacing**:
  - Field gaps: `space-y-3` or `space-y-4` between input groups.
  - Input padding: Standard compact height (`h-9` or `h-10`, `px-3 py-2`).
- **Typography & Numerical Alignment**:
  - Headings: `text-xl font-semibold text-slate-900` (Page), `text-sm font-semibold text-slate-900` (Card/Section).
  - Body: `text-sm text-slate-600`, metadata: `text-xs text-slate-500`.
  - Financial data & quantities: ALWAYS use tabular numbers (`tabular-nums font-mono` or `tabular-nums font-medium`) so decimal points align vertically in tables and receipts.

---

## 4. UI / UX DOs & DON'Ts

### Radix UI & shadcn/ui Reuse (CRITICAL)
- **DO NOT build custom primitives from scratch**: Always reuse Radix UI primitives and shadcn/ui components (`@radix-ui/*`, `shadcn/ui`).
- **NEVER build custom**:
  - Dialog / Modal / Alert Dialog (use `Dialog`, `AlertDialog` from shadcn / Radix)
  - Dropdown Menu / Select / Popover (use `DropdownMenu`, `Select`, `Popover`)
  - Drawer / Sheet / Mobile Menu (use `Sheet` or `Drawer`)
  - Toast notifications (use `sonner` or shadcn `Toast`)
  - Tabs / Accordion / Tooltips (use `Tabs`, `Accordion`, `Tooltip`)
  - Form controls (use `Form`, `Input`, `Button`, `Checkbox`, `RadioGroup`)
  - Table (use `Table` component with clean pagination/sorting)
- **DO NOT write massive boilerplate**: Import and compose existing shadcn/ui components.
- **Component File Size**: No component should exceed 300–400 lines. Break into logical subcomponents if needed.

### Design Tokens & Color Palette (STRICT)
Only use the approved design tokens across all UI views:
- **Primary**: `#4F46E5` (`indigo-600`) - Primary buttons, active states, key highlights
- **Background**: `#F8FAFC` (`slate-50`) - Main app background
- **Surface**: `#FFFFFF` (`white`) - Cards, modals, sidebars, headers
- **Text**: `#0F172A` (`slate-900`) - Primary typography
- **Secondary Text**: `#64748B` (`slate-500`) - Subheadings, labels, muted text
- **Border**: `#E2E8F0` (`slate-200`) - Dividers, card borders, input borders
- **Success**: `#16A34A` (`green-600`) - Completed sales, active badges, in-stock
- **Warning**: `#D97706` (`amber-600`) - Low stock alerts, cautionary notices
- **Danger**: `#DC2626` (`red-600`) - Destructive actions, out of stock, errors

### UX States & Interaction Rules
Every interactive view must handle the 4 fundamental states:
1. **Loading State**: Clean skeletons or subtle spinners.
2. **Empty State**: Clear informative message with an icon and call-to-action button when empty.
3. **Error State**: Friendly human-readable message (never expose raw DB errors or stack traces).
4. **Success State**: Immediate toast notification confirming action.
- **Double Submission Prevention**: Always disable buttons with loading spinners while async actions are in progress.
- **Destructive Actions**: ALWAYS require confirmation via `AlertDialog` before deleting or deactivating items.
- **Form Validation**: Validate with **Zod**; display field-level validation errors beneath inputs.

### Responsive Layout Rules
- **Desktop Layout**: Collapsible/persistent Left Sidebar (`w-64`) + Main Content area.
  - **POS Desktop View**: 2-column layout: Product Catalog Grid (`col-span-8`) on the left, Active Cart Summary (`col-span-4`) on the right.
- **Mobile Layout**: Compact Top Header with Hamburger (`Sheet` drawer navigation) + Single-column flow.
  - **POS Mobile View**: Product Catalog Grid with a sticky floating checkout bar that opens the Cart `Sheet` / `Drawer`.
- **Zero Horizontal Overflow**: Prevent `overflow-x` across all viewports (`w-full max-w-full overflow-x-hidden`).

---

## 5. Database Rules (DOs & DON'Ts)

### Table Limit: Core 6 Tables Only
Do NOT create additional tables unless explicitly required by the PRD:
1. `tenants`: `id` (UUID), `name`, `slug`, `created_at`, `updated_at`
2. `profiles`: `id` (UUID references `auth.users.id`), `tenant_id` (UUID references `tenants.id`), `role_id` (references `roles.id`), `full_name`, `avatar_url`, `created_at`, `updated_at`
3. `roles`: `id` (TEXT: 'owner', 'manager', 'cashier'), `name`, `can_manage_users`, `can_manage_products`, `can_create_sales`, `can_view_reports`
4. `products`: `id` (UUID), `tenant_id` (UUID references `tenants.id`), `name`, `sku`, `price`, `stock_quantity`, `is_active`, `image_url`, `created_at`, `updated_at`
5. `sales`: `id` (UUID), `tenant_id` (UUID references `tenants.id`), `cashier_id` (UUID references `profiles.id`), `total_amount`, `payment_method`, `created_at`
6. `sale_items`: `id` (UUID), `sale_id` (UUID references `sales.id`), `product_id` (UUID references `products.id`), `quantity`, `unit_price`, `subtotal`

### Database DOs
- **DO use UUIDs** for all primary keys (except static `roles.id` which is text `owner`, `manager`, `cashier`).
- **DO use Foreign Keys** with appropriate cascade constraints (`ON DELETE CASCADE` for tenant data, `ON DELETE RESTRICT` or soft deletion for audit integrity).
- **DO create standard indexes** on `tenant_id`, `created_at`, and foreign key columns for fast queries.
- **DO write SQL migrations** in `supabase/migrations/` with clear sequential naming.
- **DO use PostgreSQL transactions / RPC** for atomic operations.
- **DO derive reports via realtime SQL aggregation**:
  - Always calculate totals via `SUM(total_amount)`, `COUNT(*)`, `GROUP BY` from `sales` and `sale_items`.

### Database DON'Ts
- **Do NOT create report tables**: Never create `reports`, `daily_reports`, `monthly_reports`, or `dashboard_stats` tables.
- **Do NOT create inventory history or audit log tables**: Keep the database lean as specified.
- **Do NOT store passwords or auth tokens** in the `profiles` table; authentication credentials remain exclusively inside `auth.users`.
- **Do NOT store redundant `tenant_id`** in tables that are already scoped by a parent table with `tenant_id` (e.g. `sale_items` references `sales.id` which has `tenant_id`).
- **Do NOT use database triggers** when application logic or RPC functions provide clearer traceability.

### Product Deletion Lifecycle (STRICT)
- **Check sales history first**:
  - If product has **0** items in `sale_items` -> **Hard delete** is allowed (`DELETE FROM products WHERE id = $1`).
  - If product has **>= 1** items in `sale_items` -> **Soft delete only** (`UPDATE products SET is_active = false WHERE id = $1`).
- **Historical sales integrity**: Historical sales data must never be deleted, corrupted, or left with broken references.

---

## 6. Security & Multi-Tenancy Rules (DOs & DON'Ts)

### Absolute Tenant Isolation (HIGHEST PRIORITY)
A user from Tenant A must NEVER be able to read, insert, update, or delete Tenant B data under any circumstance.

### 4-Layer Defense Architecture
1. **Layer 1: Supabase Authentication (`auth.users`)**: Verifies identity and issues signed JWTs.
2. **Layer 2: User Profile Mapping (`profiles.tenant_id`)**: Securely binds every user to exactly one tenant.
3. **Layer 3: Row Level Security (RLS)**: Enforces database-level isolation on every tenant table using `tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())`.
4. **Layer 4: Server-Side Validation**: Every Server Action / Route Handler validates the tenant and permissions before executing queries.

### Security DOs
- **DO enable RLS** on all database tables without exception.
- **DO resolve `tenant_id` server-side** from `auth.uid()` via the user profile.
- **DO verify role permissions** (`can_manage_users`, `can_manage_products`, `can_create_sales`, `can_view_reports`) before executing sensitive operations.
- **DO mask error details**: Return clean, user-friendly error messages; keep database error codes and stack traces in server logs only.
- **DO keep secrets strictly server-side**: Use `NEXT_PUBLIC_` only for the Supabase Project URL and Anon Key.

### Security DON'Ts
- **Do NOT trust client-supplied `tenant_id`**: Never execute queries like `WHERE tenant_id = req.body.tenant_id` without verifying that the authenticated user actually belongs to that tenant.
- **Do NOT expose `SUPABASE_SERVICE_ROLE_KEY`** in frontend code, client bundles, or environment variables prefixed with `NEXT_PUBLIC_`.
- **Do NOT use the service-role key to bypass RLS** as a shortcut to fix query permission issues.
- **Do NOT disable RLS** (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY` is strictly FORBIDDEN).
- **Do NOT rely solely on hiding UI buttons**: A disabled or hidden button is not security. All endpoints and Server Actions must enforce role permission checks.
- **Do NOT allow users to select or switch tenants** arbitrarily.

---

## 7. Backend Architecture Rules (DOs & DON'Ts)

### Backend DOs
- **DO use Next.js App Router**:
  - Server Components for data fetching.
  - Server Actions for mutations (`createProduct`, `updateProduct`, `deleteProduct`, `checkoutSale`).
  - Route Handlers only if webhook or specific external HTTP contract is required.
- **DO use `@supabase/ssr`** for cookie-based session handling in Server Components and Server Actions.
- **DO validate all input payloads with Zod** before executing database queries or RPCs.
- **DO execute Checkout via a single atomic RPC function** (`create_sale`):
  - Lock product records (`FOR UPDATE`).
  - Verify tenant ownership.
  - Verify active status and sufficient stock.
  - Insert `sales` record.
  - Insert `sale_items` records.
  - Deduct stock from `products`.
  - Roll back entire transaction if any step fails.
- **DO maintain strict TypeScript types**: Generate or maintain accurate database types; zero `any` types.

### Backend DON'Ts (Forbidden Stack)
Do NOT install or introduce any of the following:
```text
Redux / Zustand
Prisma / Drizzle / TypeORM (Use direct Supabase client & SQL migrations)
Express / NestJS
Firebase / MongoDB / GraphQL
Docker / Microservices / Queues (RabbitMQ, Kafka, BullMQ) / WebSockets
AI / LLM features inside the app
Subscription billing engines (Stripe, LemonSqueezy, Paddle)
Complex caching layers (Redis, Memcached)
```

---

## 8. Clean Project Directory Architecture (STRICT)

To maintain long-term scalability and eliminate code clutter, all files must reside in their designated directories:

```text
src/
├── actions/             # Server Actions for mutations (auth, products, checkout, users)
├── app/                 # Next.js App Router (pages, layouts, route handlers only)
│   ├── (auth)/          # Authentication routes (login, register/tenant onboarding)
│   ├── (dashboard)/     # Authenticated application shell (layout with sidebar & nav)
│   │   ├── pos/         # POS terminal screen (catalog + cart + checkout)
│   │   ├── products/    # Product catalog management
│   │   ├── sales/       # Sales history & receipts
│   │   ├── reports/     # Realtime aggregated financial reports
│   │   └── users/       # Staff & cashier management (Owner only)
│   ├── globals.css      # Design tokens and Tailwind base
│   └── layout.tsx       # Root layout with Toaster provider
├── components/
│   ├── ui/              # shadcn/ui and Radix UI primitives (DO NOT edit manually unless configuring)
│   ├── layout/          # Shell layout components (AppSidebar, MobileNav, Header, UserMenu)
│   ├── pos/             # POS domain components (ProductGrid, CartPanel, CartDrawer, PaymentDialog)
│   ├── products/        # Product domain components (ProductTable, ProductFormDialog, DeleteConfirm)
│   ├── sales/           # Sales domain components (SalesTable, ReceiptDialog)
│   └── common/          # Reusable UX state components (EmptyState, TableSkeleton, ErrorBanner)
├── lib/
│   ├── supabase/        # Supabase client instances (client.ts, server.ts, middleware.ts)
│   ├── utils.ts         # General utilities & cn helper
│   ├── formatters.ts    # Tabular currency and date formatters
│   └── constants.ts     # System roles, payment methods, navigation links
├── types/
│   ├── database.ts      # Strict database entity interfaces (Core 6 tables)
│   └── index.ts         # Shared action response, cart, and domain types
└── validations/
    ├── auth.ts          # Zod validation schemas for login and registration
    ├── product.ts       # Zod validation schemas for product CRUD
    └── checkout.ts      # Zod validation schemas for checkout payload
```

---

## 9. Definition of Done & Verification Checklist

Before marking any feature as complete:
- [ ] Directory organization matches the clean project structure.
- [ ] No AI-fluff copy; microcopy is concise, realistic, and professional.
- [ ] No glowing gradients or gimmick animations; UI is crisp, solid, and high-density.
- [ ] Spacing & padding verified: compact, structured, no awkward gaps.
- [ ] Tabular figures used for currency and numbers (`tabular-nums font-mono`).
- [ ] Responsive layout verified: mobile drawer, desktop 2-column, zero horizontal overflow.
- [ ] No code comments present in source files.
- [ ] No placeholder, mock, or rushed stub functions.
- [ ] TypeScript compiles cleanly with zero errors (`tsc --noEmit`).
- [ ] No `any` types used.
- [ ] RLS is enabled and verified on all modified tables.
- [ ] Tenant isolation verified: queries cannot access cross-tenant data.
- [ ] Role authorization verified: non-permitted roles are rejected.
- [ ] Server Action inputs validated with Zod.
- [ ] Checkout runs atomically via RPC with rollback on failure.
- [ ] Product deletion obeys the 0-sale hard delete / >0 sale soft delete rule.
- [ ] Loading, Empty, Error, and Success states are present.
- [ ] Zero unhandled browser or server console errors.

