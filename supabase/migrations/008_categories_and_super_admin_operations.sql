CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_categories_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_categories ON categories;
CREATE POLICY tenant_isolation_categories ON categories
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE OR REPLACE FUNCTION create_sale(
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'cash',
  p_target_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID := auth.uid();
  v_is_super BOOLEAN := false;
  v_sale_id UUID;
  v_total_amount NUMERIC(12, 2) := 0;
  v_item RECORD;
  v_product RECORD;
  v_tenant RECORD;
  v_plan RECORD;
  v_current_month_sales_count INT;
BEGIN
  SELECT tenant_id, is_super_admin INTO v_tenant_id, v_is_super FROM profiles WHERE id = v_user_id;

  IF v_is_super AND p_target_tenant_id IS NOT NULL THEN
    v_tenant_id := p_target_tenant_id;
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Profile or tenant not found.';
  END IF;

  SELECT * INTO v_tenant FROM tenants WHERE id = v_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found.';
  END IF;

  IF v_tenant.subscription_status = 'suspended' THEN
    RAISE EXCEPTION 'Store subscription is currently suspended.';
  END IF;

  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_tenant.plan_id;
  IF v_plan IS NOT NULL AND v_plan.max_orders_per_month IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_month_sales_count
    FROM sales
    WHERE tenant_id = v_tenant_id
      AND created_at >= date_trunc('month', now());

    IF v_current_month_sales_count >= v_plan.max_orders_per_month THEN
      RAISE EXCEPTION 'Monthly voucher limit reached (% vouchers) on the % plan. Upgrade plan to process more sales.',
        v_plan.max_orders_per_month, v_plan.name;
    END IF;
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

DO $$
DECLARE
  t_record RECORD;
BEGIN
  FOR t_record IN SELECT id FROM tenants LOOP
    INSERT INTO categories (tenant_id, name)
    VALUES 
      (t_record.id, 'Beverages'),
      (t_record.id, 'Snacks'),
      (t_record.id, 'Bakery'),
      (t_record.id, 'General')
    ON CONFLICT (tenant_id, name) DO NOTHING;
  END LOOP;
END $$;
