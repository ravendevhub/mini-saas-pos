# Mini SaaS POS

A modern, high-performance, multi-tenant cloud Point of Sale (POS) and inventory management SaaS built with Next.js App Router, React 19, Tailwind CSS v4, and Supabase PostgreSQL.

---

## Typography & Fonts

This project implements the official **SaaS & ERP typography standard** loaded via `next/font/google`:

- **Primary UI Font Stack — Inter + Noto Sans Myanmar (`--font-sans`)**:
  - **Inter**: The gold standard for modern web, ERP, POS, and SaaS interfaces (designed by Rasmus Andersson). Adopted globally by Stripe, Linear, GitHub, and Figma for crystal-clear readability and neutral grotesque clarity.
  - **Noto Sans Myanmar**: Google's official unicode typeface for Myanmar language, providing seamless bilingual typography alongside Inter.
- **Monospace & Financial Font — Roboto Mono (`--font-mono`)**:
  - High-precision Google monospace typeface paired with `tabular-nums`.
  - Applied to all currency amounts, item prices, SKU barcodes, receipt IDs, transaction totals, quantities, and timestamps so numerical figures align vertically in data tables, receipts, and analytics charts.

### Standard Typographic Hierarchy & Scale
| Level | Font Size | Weight | Tailwind Utility | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `24px` | `600` (SemiBold) | `text-2xl font-semibold` | Screen titles & dashboard headers |
| **Section Title** | `18px` | `600` (SemiBold) | `text-lg font-semibold` | Panel & section dividers |
| **Card Title** | `15-16px` | `600` (SemiBold) | `text-base font-semibold` | Metric & form card headers |
| **Body Text** | `14px` | `400` (Normal) | `text-sm font-normal` | Descriptions, notices & standard body |
| **Table Content** | `13-14px` | `400` (Normal) | `text-xs / text-sm` | Multi-row dense table data scanning |
| **Form Input** | `14px` | `400` (Normal) | `text-sm h-9 px-3` | Standard compact form fields |
| **Buttons** | `14px` | `500-600` | `text-sm font-medium` | Action buttons & call-to-actions |
| **Caption / Meta** | `12px` | `400` (Normal) | `text-xs text-slate-500` | Helper text, timestamps & microcopy |
| **Big KPI Number** | `24-32px` | `600-700` | `text-2xl / text-3xl font-bold font-mono tabular-nums` | Financial totals, revenue & counters |

---

## Complete Tech Stack & Libraries

### Core Framework & Runtime
- **Next.js 16 (App Router)**: Utilizing React Server Components (RSC) for data fetching, Server Actions for mutations, dynamic routing (`/[shopCode]`), and Turbopack for compilation.
- **React 19 & React DOM 19**: Modern concurrent React architecture with `useTransition`, `useOptimistic`, and `useActionState`.
- **TypeScript 5**: Strict type-checking across the entire codebase with zero `any` types.

### Database, Auth & Multi-Tenancy
- **Supabase (PostgreSQL 15+)**: Relational database with strict foreign key constraints, indexes, and automated timestamps.
- **`@supabase/ssr`**: Secure, cookie-based session handling across Server Components, Server Actions, and Next.js middleware.
- **`@supabase/supabase-js`**: Direct JavaScript/TypeScript client for PostgreSQL queries and RPC function calls.
- **PostgreSQL Row Level Security (RLS)**: Database-level tenant isolation ensuring data belonging to Tenant A is never accessible to Tenant B.
- **PostgreSQL Atomic RPC (`create_sale`)**: Single-transaction checkout function with row-locking (`FOR UPDATE`) to prevent race conditions, negative inventory, or double sales.

### Security & Hardening Architecture
- **Framework Masking**: `poweredByHeader: false` disables the `X-Powered-By: Next.js` header to prevent automated version fingerprinting by scanners.
- **Content Security Policy (CSP)**: Strict whitelisting of scripts, fonts, frames, and API endpoints, defending against Cross-Site Scripting (XSS) and code injection.
- **HTTP Defense Headers**:
  - `X-Frame-Options: DENY`: Complete protection against Clickjacking attacks.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-type confusion attacks.
  - `Strict-Transport-Security (HSTS)`: Enforces TLS encryption for 2 years with preloading.
  - `Cross-Origin-Opener-Policy: same-origin` & `X-Permitted-Cross-Domain-Policies: none`.
- **Sliding-Window Rate Limiting (`src/lib/rate-limit.ts`)**:
  - In-memory rate limiting applied to authentication endpoints without external dependencies.
  - Login attempts limited to 5 requests per 60 seconds per IP/account.
  - Store registration limited to 3 requests per 120 seconds per IP.
  - Automatic IP extraction supporting `cf-connecting-ip`, `x-forwarded-for`, and `x-real-ip`.

### Cloudflare CDN & Edge Acceleration
- **Edge Cache Headers (`next.config.ts`)**:
  - `/_next/static/*`: Edge-cached for 1 year with `Cloudflare-CDN-Cache-Control: max-age=31536000` and `CDN-Cache-Control: max-age=31536000`.
  - Dynamic multi-tenant routes (`/*`): Configured with `no-cache, no-store, must-revalidate` to prevent edge caching of authenticated tenant data.
- **CSP Whitelisting**: Pre-configured support for Cloudflare CDNjs, Turnstile Bot Defense, and Cloudflare Web Analytics beacons.

### UI Architecture & Design System
- **Tailwind CSS v4**: Ultra-fast CSS engine utilizing inline `@theme` tokens, CSS custom properties, and automated dark mode variants.
- **Radix UI Primitives (`@radix-ui/*`) & shadcn/ui**:
  - `Dialog` & `AlertDialog`: Confirmation modals for destructive actions, receipt previews, and product editing.
  - `Select` & `DropdownMenu`: Dropdowns for product categories, payment channels, and subscription tiers.
  - `Sheet` / `Drawer` (`vaul`): Smooth sliding cart drawer for mobile and compact POS viewports.
  - `Table`: Dense data tables with multi-column sorting and filtering.
  - `Badge`, `Card`, `Button`, `Input`: Consistent, accessible atomic components.
- **Lucide React (`lucide-react`)**: Clean, minimalist vector icons.
- **Sonner (`sonner`)**: Rich toast notifications for immediate operational feedback.
- **`class-variance-authority` (cva) & `cn`**: Utility for building type-safe UI variants and merging Tailwind class names.
- **`tw-animate-css`**: Subtle CSS micro-animations for interactive elements.

### Data Validation
- **Zod (`zod`)**: Runtime schema validation for all mutation payloads (authentication, product CRUD, checkout payload, tenant registration, and subscription payment requests).

---

## Key Modules & Functional Architecture

### 1. Authentication & Onboarding (`/login` & `/register`)
- Luxury retail boutique visual theme featuring high-resolution photography and luminous frosted glassmorphism cards (`backdrop-blur-2xl bg-white/85 border border-white shadow-2xl`).
- High-contrast pure white input capsules with leading vector icons (`Store`, `Hash`, `User`, `Mail`, `Lock`).
- Interactive password visibility toggle with accurate `Eye` / `EyeOff` indicator states.
- Direct navigation between merchant login and 30-day Free Trial store registration.

### 2. Store Executive Dashboard (`/[shopCode]/dashboard`)
- Realtime revenue figures, today's order counts, low-stock warnings, and top-moving products.
- In-memory activity log tracking operational events (cart clear, item add, staff creation).

### 3. Point of Sale Terminal (`/[shopCode]/pos`)
- Real-time catalog grid with instant product search, barcode scanning, and category filters.
- Active cart calculations with live subtotal, quantity stepping, and out-of-stock guards.
- Multi-channel checkout (Cash, Card, QR Transfer) executing the atomic `create_sale` database RPC.
- Printable thermal receipt modal styled specifically for 80mm POS receipt printers via `@media print` CSS.

### 4. Inventory & Category Management (`/[shopCode]/products`)
- Category management: create, rename, and delete custom store categories.
- Product CRUD: SKU, name, price, stock quantity, category assignment, and image upload.
- Intelligent deletion lifecycle: Hard delete if 0 sales history; Soft delete (`is_active = false`) if historic sales exist to preserve audit trails.

### 5. Sales History & Receipts (`/[shopCode]/sales`)
- Complete ledger of store orders, itemized receipts, and cashier names.
- Multi-dimensional filters: Quick presets (Today, Yesterday, Last 7 Days, This Month, All Time), Custom Date Range (`From Date` to `To Date`), and Payment Method selector.
- Live order counter and revenue accumulator.

### 6. Financial Analytics & Reports (`/[shopCode]/reports`)
- Realtime aggregated financial metrics: Period Revenue, Orders Processed, Units Dispensed, and Average Order Value (AOV).
- Payment channel volume breakdown and top moving inventory rankings.
- Dynamic date period filters with instant client-side recalculation.

### 7. Staff & Access Control (`/[shopCode]/users`)
- Role-Based Access Control (RBAC):
  - **Owner**: Full access to store settings, staff accounts, financial reports, and subscription plans.
  - **Manager**: Catalog management, inventory, sales receipts, and analytics reports.
  - **Cashier**: POS cash register terminal and sales completion.

### 8. Platform Founder Console (`/founder`)
- Dedicated super admin portal accessible only to platform administrators.
- Tenant management: inspect all registered shops, assign plans, suspend/reactivate stores, or grant billing grace periods.
- Custom payment methods: configure founder bank accounts (KBZPay, WavePay, Mobile Banking) with account numbers and QR code images.
- Subscription upgrade requests: review merchant payment transfer slips, verify transaction IDs, and activate plan tiers.
- Plan quota configuration: customize monthly voucher limits, product limits, and staff limits per subscription tier (Free Trial, Starter, Pro).

### 9. Navigation Shell & Sidebar Layout
- Collapsible Left Mini-Sidebar (`AppSidebar.tsx`): 16px icon-only mode vs 64px full mode with state persistence in `localStorage`.
- Top-Right Header User Menu (`Header.tsx`): Clean Radix UI avatar dropdown providing store identity, plan badge, and logout.
- Mobile drawer navigation utilizing Vaul / Radix Sheet.

---

## Project Directory Structure

```text
src/
├── actions/             # Server Actions (auth, checkout, products, staff, subscription, founder)
├── app/                 # Next.js App Router
│   ├── (auth)/          # Authentication routes (login, register)
│   ├── [shopCode]/      # Tenant-scoped dashboard routes
│   │   ├── dashboard/   # Store dashboard & quick metrics
│   │   ├── pos/         # POS cash register terminal
│   │   ├── products/    # Product catalog & categories
│   │   ├── sales/       # Sales history & receipts
│   │   ├── reports/     # Financial reports with custom date filters
│   │   ├── users/       # Staff & cashier management
│   │   └── settings/    # Store profile & subscription plan upgrade
│   ├── founder/         # Platform Founder / Super Admin portal
│   │   ├── (admin)/     # Protected founder control plane
│   │   └── login/       # Dedicated founder login screen
│   ├── globals.css      # Tailwind v4 theme, print rules, design tokens
│   └── layout.tsx       # Root layout with Google fonts & Sonner toaster
├── components/          # Reusable UI & domain components
│   ├── common/          # EmptyState, ErrorBanner, ConfirmationDialogs
│   ├── dashboard/       # Action logs, stat cards, metric widgets
│   ├── founder/         # Founder admin tables, payment setup, slip review
│   ├── layout/          # AppSidebar, Header, MobileNav
│   ├── pos/             # POSTerminal, CartPanel, CartDrawer, ReceiptDialog
│   ├── products/        # ProductTable, ProductFormDialog, CategoryManager
│   ├── reports/         # ReportsView with custom date range picker
│   ├── sales/           # SalesTable, SaleDetailDialog
│   ├── settings/        # PlanUpgradeDialog with slip upload
│   ├── ui/              # Radix UI & shadcn primitives
│   └── users/           # StaffTable, AddStaffDialog
├── lib/
│   ├── supabase/        # Supabase server, client, and middleware instances
│   ├── rate-limit.ts    # Sliding-window rate limiter & IP resolution
│   ├── formatters.ts    # Tabular currency and datetime formatters
│   ├── constants.ts     # Navigation items, roles, and payment channels
│   └── action-logger.ts # Non-database operational activity logger
├── types/               # Strict TypeScript database & domain interfaces
└── validations/         # Zod schemas for forms and mutations
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Side Only Service Key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/ravendevhub/mini-saas-pos.git

# Enter project directory
cd mini-saas-pos

# Install dependencies
npm install
```

### 2. Running Locally

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## License

This project is licensed under the MIT License.
