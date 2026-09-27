# Mini SaaS POS

A modern, multi-tenant cloud Point of Sale (POS) and inventory management SaaS built with Next.js App Router and Supabase PostgreSQL.

---

## Features

- **Multi-Tenant Isolation**: Scoped data access with custom store paths (`/[shopCode]`) and PostgreSQL Row Level Security (RLS).
- **Fast POS Terminal**: Quick product search, barcode scanning, category filtering, cart management, and out-of-stock prevention.
- **Atomic Checkout**: Single-transaction database RPC (`create_sale`) with row-locking (`FOR UPDATE`) and stock deduction.
- **Inventory & Categories**: Realtime stock tracking, SKU management, category organization, and sales-history-safe deletion.
- **Sales History**: Itemized order receipts, cashier records, and search with custom date ranges and payment channel filters.
- **Financial Analytics & Reports**: Live aggregated metrics (Period Revenue, Orders, Items Dispensed, Avg Order Value, Payment Breakdown, Top Moving Items) with presets (Today, Yesterday, 7 Days, Month, All-Time) and custom date filtering.
- **Role-Based Access Control (RBAC)**: Owner, Manager, and Cashier roles with granular permissions.
- **Platform Founder Console (`/founder`)**: Super admin portal to manage stores, subscription tiers, custom QR payment methods, and bank transfer slip approvals.
- **Tiered Subscriptions**: Free Trial, Starter, and Pro plans with product, staff, and monthly voucher quotas.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS Policies, Database Functions/RPC)
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI Primitives & shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner Toasts

---

## Project Structure

```text
src/
├── actions/             # Server Actions (auth, checkout, products, staff, subscriptions)
├── app/                 # Next.js App Router
│   ├── (auth)/          # Authentication routes (login, register)
│   ├── [shopCode]/      # Tenant-scoped dashboard routes
│   │   ├── dashboard/   # Executive store dashboard & quick metrics
│   │   ├── pos/         # POS cash register terminal
│   │   ├── products/    # Product catalog & categories
│   │   ├── sales/       # Sales history & receipts
│   │   ├── reports/     # Financial reports with custom date filters
│   │   ├── users/       # Staff & cashier management
│   │   └── settings/    # Store profile & subscription plan upgrade
│   └── founder/         # Platform Founder / Super Admin console
├── components/          # Reusable UI & domain components
│   ├── pos/             # POS terminal, cart drawer, payment dialog
│   ├── products/        # Product tables, dialogs, categories
│   ├── reports/         # Financial report charts & filters
│   ├── sales/           # Sales table & receipt viewer
│   ├── founder/         # Founder admin control panels
│   └── ui/              # Radix UI / shadcn primitives
├── lib/
│   ├── supabase/        # Supabase server, client, and middleware clients
│   ├── formatters.ts    # Tabular currency & date formatters
│   └── constants.ts     # Navigation items & payment methods
├── types/               # Strict TypeScript interfaces
└── validations/         # Zod schemas for all mutations
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ or 20+
- A Supabase project with database migrations executed

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## User Roles & Default Paths

| Role | Access Level | Default Landing Page |
| :--- | :--- | :--- |
| **Store Owner** | Full store control, staff management, financial reports, plan upgrade | `/[shopCode]/dashboard` |
| **Store Manager** | Catalog & inventory management, sales receipts, financial reports | `/[shopCode]/dashboard` |
| **Cashier** | Point of Sale terminal & checkout processing | `/[shopCode]/dashboard` |
| **Platform Founder** | Super admin console, multi-tenant overview, payment & plan approval | `/founder` |

---

## License

MIT
