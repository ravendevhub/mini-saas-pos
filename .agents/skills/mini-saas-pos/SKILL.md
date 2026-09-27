---
name: mini-saas-pos
description: >-
  Provides end-to-end implementation procedures, database schema definitions, PostgreSQL RPC
  functions, multi-tenant RLS policies, and business logic for the Mini SaaS POS system.
  Use when creating database migrations, building POS checkout flows, implementing tenant isolation,
  or writing sales reporting queries.
---

# Mini SaaS POS Implementation Skill

This skill contains the database architecture, security constraints, and business logic implementation standards for the **Mini SaaS POS** project.

---

## 1. Database Schema Specifications (Core 6 Tables)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_products BOOLEAN DEFAULT false,
  can_create_sales BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false
);

INSERT INTO roles (id, name, can_manage_users, can_manage_products, can_create_sales, can_view_reports) VALUES
('owner', 'Owner', true, true, true, true),
('manager', 'Manager', false, true, true, true),
('cashier', 'Cashier', false, false, true, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES profiles(id),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
```

---

## 2. Row Level Security (RLS) Helper & Policies

```sql
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for products" ON products
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant isolation for sales" ON sales
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant isolation for sale_items" ON sale_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
        AND sales.tenant_id = get_current_user_tenant_id()
    )
  );
```

---

## 3. Atomic POS Checkout RPC (`create_sale`)

```sql
CREATE OR REPLACE FUNCTION create_sale(
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'cash'
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID := auth.uid();
  v_sale_id UUID;
  v_total_amount NUMERIC(12, 2) := 0;
  v_item RECORD;
  v_product RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Profile or tenant not found.';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero.';
    END IF;

    SELECT id, price, stock_quantity, is_active, name
    INTO v_product
    FROM products
    WHERE id = v_item.product_id AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found in current tenant.', v_item.product_id;
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product "%" is inactive.', v_product.name;
    END IF;

    IF v_product.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %).',
        v_product.name, v_product.stock_quantity, v_item.quantity;
    END IF;

    v_total_amount := v_total_amount + (v_product.price * v_item.quantity);
  END LOOP;

  INSERT INTO sales (tenant_id, cashier_id, total_amount, payment_method)
  VALUES (v_tenant_id, v_user_id, v_total_amount, p_payment_method)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    SELECT price INTO v_product FROM products WHERE id = v_item.product_id;

    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_product.price, (v_product.price * v_item.quantity));

    UPDATE products
    SET stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Product Deletion Rule

1. Check `sale_items` for existence of `product_id`.
2. If count = 0: `DELETE FROM products WHERE id = $1` (Hard delete).
3. If count > 0: `UPDATE products SET is_active = false WHERE id = $1` (Soft delete / Archive).

---

## 5. Reports Aggregation Standards

Never write to a cached report table. Use SQL aggregation:
- Today's Revenue:
  ```sql
  SELECT COALESCE(SUM(total_amount), 0) AS today_revenue, COUNT(*) AS today_orders
  FROM sales
  WHERE tenant_id = $1 AND created_at >= CURRENT_DATE;
  ```
- Top Selling Products:
  ```sql
  SELECT p.name, SUM(si.quantity) AS total_sold, SUM(si.subtotal) AS total_revenue
  FROM sale_items si
  JOIN products p ON si.product_id = p.id
  JOIN sales s ON si.sale_id = s.id
  WHERE s.tenant_id = $1
  GROUP BY p.id, p.name
  ORDER BY total_sold DESC
  LIMIT 5;
  ```

---

## 6. Subscription Plans & Tier Limits

Subscription tiers restrict maximum allowed catalog products and staff accounts per store:

```sql
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_month NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_products INT NOT NULL,
  max_staff INT NOT NULL,
  can_view_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Default Tiers:
- `free`: Free Trial, $0/month, max 30 products, 1 staff seat
- `starter`: Starter Store, $15/month, max 200 products, 5 staff seats
- `pro`: Pro Business, $35/month, max 10,000 products, 25 staff seats

---

## 7. Founder Super Admin Architecture

Founder Super Admin console operates at `/founder` and is guarded by `profiles.is_super_admin`:
- Platform overview across all merchants
- Upgrade or downgrade store subscription plans
- Suspend or activate tenant access
- Add subscription extension days (+30 days)

