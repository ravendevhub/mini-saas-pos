# Mini SaaS POS

A modern, high-performance, multi-tenant cloud Point of Sale (POS) and inventory management SaaS built with Next.js App Router, React 19, Tailwind CSS v4, and Supabase PostgreSQL.

---

## 🎨 Typography & Fonts

This project implements the official **Google Fonts & shadcn/ui typography standards** loaded via `next/font/google`:

- **Primary UI Font — Inter (`--font-sans`)**:
  - The gold standard for modern web and SaaS application interfaces (designed by Rasmus Andersson).
  - Adopted globally by Stripe, GitHub, Figma, Linear, and shadcn/ui for crystal-clear readability, neutral grotesque clarity, and tall x-height.
  - Applied across all headers, navigation elements, inputs, buttons, and descriptive body text.
- **Monospace & Financial Font — Roboto Mono (`--font-mono`)**:
  - High-precision Google monospace typeface paired with `tabular-nums`.
  - Applied to all currency amounts, item prices, SKU barcodes, receipt IDs, transaction totals, quantities, and timestamps so numerical figures align vertically in data tables, receipts, and analytics charts.

---

## 🛠️ Complete Tech Stack & Libraries

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

## 🚀 Key Modules & Functional Architecture

### 1. Store Executive Dashboard (`/[shopCode]/dashboard`)
- Realtime revenue figures, today's order counts, low-stock warnings, and top-moving products.
- In-memory activity log tracking operational events (cart clear, item add, staff creation).

### 2. Point of Sale Terminal (`/[shopCode]/pos`)
- Real-time catalog grid with instant product search, barcode scanning, and category filters.
- Active cart calculations with live subtotal, quantity stepping, and out-of-stock guards.
- Multi-channel checkout (Cash, Card, QR Transfer) executing the atomic `create_sale` database RPC.
- Printable thermal receipt modal styled specifically for 80mm POS receipt printers via `@media print` CSS.

### 3. Inventory & Category Management (`/[shopCode]/products`)
- Category management: create, rename, and delete custom store categories.
- Product CRUD: SKU, name, price, stock quantity, category assignment, and image upload.
- Intelligent deletion lifecycle: Hard delete if 0 sales history; Soft delete (`is_active = false`) if historic sales exist to preserve audit trails.

### 4. Sales History & Receipts (`/[shopCode]/sales`)
- Complete ledger of store orders, itemized receipts, and cashier names.
- Multi-dimensional filters: Quick presets (Today, Yesterday, Last 7 Days, This Month, All Time), Custom Date Range (`From Date` to `To Date`), and Payment Method selector.
- Live order counter and revenue accumulator.

### 5. Financial Analytics & Reports (`/[shopCode]/reports`)
- Realtime aggregated financial metrics: Period Revenue, Orders Processed, Units Dispensed, and Average Order Value (AOV).
- Payment channel volume breakdown and top moving inventory rankings.
- Dynamic date period filters with instant client-side recalculation.

### 6. Staff & Access Control (`/[shopCode]/users`)
- Role-Based Access Control (RBAC):
  - **Owner**: Full access to store settings, staff accounts, financial reports, and subscription plans.
  - **Manager**: Catalog management, inventory, sales receipts, and analytics reports.
  - **Cashier**: POS cash register terminal and sales completion.

### 7. Platform Founder Console (`/founder`)
- Dedicated super admin portal accessible only to platform administrators.
- Tenant management: inspect all registered shops, assign plans, suspend/reactivate stores, or grant billing grace periods.
- Custom payment methods: configure founder bank accounts (KBZPay, WavePay, Mobile Banking) with account numbers and QR code images.
- Subscription upgrade requests: review merchant payment transfer slips, verify transaction IDs, and activate plan tiers.
- Plan quota configuration: customize monthly voucher limits, product limits, and staff limits per subscription tier (Free Trial, Starter, Pro).

---

## 📁 Project Directory Structure

```text
src/
├── actions/             # Server Actions (auth, checkout, products, staff, subscription)
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
│   └── layout.tsx       # Root layout with Geist fonts & Sonner toaster
├── components/          # Reusable UI & domain components
│   ├── common/          # EmptyState, ErrorBanner, ConfirmationDialogs
│   ├── dashboard/       # Action logs, stat cards, metric widgets
│   ├── founder/         # Founder admin tables, payment setup, slip review
│   ├── layout/          # AppSidebar, MobileNav
│   ├── pos/             # POSTerminal, CartPanel, CartDrawer, ReceiptDialog
│   ├── products/        # ProductTable, ProductFormDialog, CategoryManager
│   ├── reports/         # ReportsView with custom date range picker
│   ├── sales/           # SalesTable, SaleDetailDialog
│   ├── settings/        # PlanUpgradeDialog with slip upload
│   ├── ui/              # Radix UI & shadcn primitives
│   └── users/           # StaffTable, AddStaffDialog
├── lib/
│   ├── supabase/        # Supabase server, client, and middleware instances
│   ├── formatters.ts    # Tabular currency and datetime formatters
│   ├── constants.ts     # Navigation items, roles, and payment channels
│   └── action-logger.ts # Non-database operational activity logger
├── types/               # Strict TypeScript database & domain interfaces
└── validations/         # Zod schemas for forms and mutations
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Side Only Service Key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 🚀 Getting Started

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

## 📄 License

This project is licensed under the MIT License.
