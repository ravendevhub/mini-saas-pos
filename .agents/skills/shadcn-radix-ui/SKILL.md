---
name: shadcn-radix-ui
description: >-
  Provides guidelines and best practices for integrating, configuring, and composing
  Radix UI primitives and shadcn/ui components in Next.js. Use when implementing or
  refactoring UI components, dialogs, forms, tables, mobile drawers, toasts, or responsive layouts.
---

# Radix UI & shadcn/ui Architecture Skill

This skill enforces best practices for building clean, accessible, and responsive user interfaces using Radix UI primitives and shadcn/ui components without writing redundant custom code.

---

## 1. Anti-AI Slop & Visual Craftsmanship Standards

This is a real-world POS application for busy cashiers, store owners, and managers.

### Visual Constraints:
- **No Gimmick Animations or Neon Glows**: Avoid drop-shadow glows (`shadow-[0_0_20px_#4f46e5]`), floating decorative spheres, or iridescent background gradients.
- **Solid, Clean Surfaces**: White cards (`bg-white`) on a crisp light slate background (`bg-slate-50`).
- **Subtle Borders**: Use single-pixel borders (`border border-slate-200`) instead of heavy box shadows.
- **High Information Density**: Enable cashiers and managers to scan dozens of products and line items quickly without giant, awkward whitespace.

---

## 2. Realistic POS Microcopy vs AI Marketing Fluff

All UI text, labels, dialog messages, and empty states must be short, factual, direct, and pragmatic.

| Context | AI Marketing Fluff (BANNED) | Pragmatic POS Copy (REQUIRED) |
| :--- | :--- | :--- |
| Button | "Experience Seamless Smart Checkout Now" | "Charge $24.50" or "Checkout" |
| Empty State | "Your digital inventory galaxy awaits its first sparkle!" | "No products in catalog. Add your first item." |
| Search Placeholder | "Search through your universe of smart products..." | "Search products by name or SKU..." |
| Delete Modal | "Are you ready to say goodbye to this precious entity?" | "Delete this product? Items with sales history will be archived." |
| Toast Alert | "Success! Your transaction has been blessed by the system." | "Sale completed successfully." |
| Stock Warning | "Attention mortal: Your supplies are dwindling into the void!" | "Low stock: 2 units remaining." |

---

## 3. Strict Spacing, Padding & Density Scale

Adhere to the standard Tailwind 4px grid across all views:

### Component Dimensions & Padding:
- **Inputs & Buttons**: Height `h-9` or `h-10`, horizontal padding `px-3`, text `text-sm font-medium`.
- **Product Card**: Padding `p-3` or `p-4`, rounded `rounded-lg`, border `border border-slate-200`, subtle hover `hover:border-indigo-400 hover:shadow-sm transition-colors`.
- **Cart Summary Panel**: Padding `p-4` or `p-5`, sticky positioning `sticky top-4`.
- **Table Density**: Table cell padding `py-2.5 px-3 text-sm`.
- **Form Groups**: Gap between fields `space-y-3` or `space-y-4`. Never exceed `space-y-6`.
- **Page Container**: Padding `p-4 sm:p-6 lg:p-8`, maximum width constraint `max-w-7xl mx-auto`.

### Typography & Numerical Alignment:
- **Headers**: Page titles `text-xl sm:text-2xl font-semibold text-slate-900`, section titles `text-sm sm:text-base font-medium text-slate-800`.
- **Secondary Text**: `text-xs text-slate-500` or `text-sm text-slate-600`.
- **Financial & Quantity Figures**: Always use `tabular-nums font-mono` or `tabular-nums font-medium` so currency decimals line up precisely.

---

## 4. Responsive Layout Architecture

### A. Desktop View (`lg:` >= 1024px)
- Persistent Left Sidebar (`w-64 shrink-0 border-r border-slate-200 bg-white`).
- POS View: 12-column grid:
  - Product Catalog: `col-span-8 space-y-4`.
  - Active Cart: `col-span-4 sticky top-4`.

### B. Mobile View (`< md` < 768px)
- Header: Sticky compact top bar (`h-14 border-b bg-white flex items-center justify-between px-4`).
- Hamburger trigger opens shadcn `Sheet` navigation drawer.
- Product Catalog: Single or 2-column grid (`grid-cols-2 gap-3`).
- Sticky Bottom Floating Checkout Bar:
  - Position: `fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between z-40`.
  - Displays: "3 items • $45.00" and a "View Cart" button.
  - Clicking "View Cart" opens a shadcn `Sheet` (Drawer) showing full line items, modifier/quantity controls, and the final "Complete Sale" action.
- Prevent Horizontal Overflow: Always apply `w-full max-w-full overflow-x-hidden` on parent wrappers.

---

## 5. Primitive Mapping & Zero Reinvention

Always install and compose the official shadcn/ui or Radix UI component:

| UI Need | Required Component | Installation Command |
| :--- | :--- | :--- |
| Modal / Popup | `Dialog` | `npx shadcn@latest add dialog` |
| Delete / Confirm Prompt | `AlertDialog` | `npx shadcn@latest add alert-dialog` |
| Mobile Navigation / Cart Drawer | `Sheet` / `Drawer` | `npx shadcn@latest add sheet drawer` |
| Dropdown actions | `DropdownMenu` | `npx shadcn@latest add dropdown-menu` |
| Select box / Picker | `Select` | `npx shadcn@latest add select` |
| Form & Validation | `Form` (react-hook-form + zod) | `npx shadcn@latest add form` |
| Data display / lists | `Table` | `npx shadcn@latest add table` |
| Loading placeholders | `Skeleton` | `npx shadcn@latest add skeleton` |
| Toast feedback | `Sonner` | `npx shadcn@latest add sonner` |
| Status tags | `Badge` | `npx shadcn@latest add badge` |
| User avatar | `Avatar` | `npx shadcn@latest add avatar` |
| Tabbed views | `Tabs` | `npx shadcn@latest add tabs` |

---

## 6. Color Tokens

```css
:root {
  --primary: #4F46E5;
  --primary-foreground: #FFFFFF;
  --background: #F8FAFC;
  --surface: #FFFFFF;
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E2E8F0;
  --success: #16A34A;
  --warning: #D97706;
  --danger: #DC2626;
}
```

---

## 7. Standard 4-State UI Pattern

Every view must explicitly implement all 4 states:
1. **Loading**: Skeletons matching actual card/table dimensions.
2. **Empty State**: Icon, direct 1-line explanation, CTA button.
3. **Error State**: Non-technical banner with retry action.
4. **Success State**: Immediate toast notification via `sonner`.
