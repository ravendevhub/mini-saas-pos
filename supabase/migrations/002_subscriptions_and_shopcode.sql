CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_month NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_products INT NOT NULL,
  max_staff INT NOT NULL,
  can_view_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO subscription_plans (id, name, price_per_month, max_products, max_staff, can_view_reports) VALUES
('free', 'Free Trial', 0.00, 30, 1, true),
('starter', 'Starter Store', 15.00, 200, 5, true),
('pro', 'Pro Business', 35.00, 10000, 25, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_month = EXCLUDED.price_per_month,
  max_products = EXCLUDED.max_products,
  max_staff = EXCLUDED.max_staff,
  can_view_reports = EXCLUDED.can_view_reports;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES subscription_plans(id) DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');

UPDATE tenants SET shop_code = lower(regexp_replace(slug, '[^a-zA-Z0-9]', '', 'g')) WHERE shop_code IS NULL;
UPDATE tenants SET shop_code = 'store-' || substr(id::text, 1, 6) WHERE shop_code IS NULL OR shop_code = '';

ALTER TABLE tenants ALTER COLUMN shop_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_shop_code ON tenants(shop_code);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL
  USING (
    id = get_current_user_tenant_id() OR is_current_user_super_admin()
  )
  WITH CHECK (
    id = get_current_user_tenant_id() OR is_current_user_super_admin()
  );

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_subscription_plans ON subscription_plans;
CREATE POLICY read_subscription_plans ON subscription_plans
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS manage_subscription_plans ON subscription_plans;
CREATE POLICY manage_subscription_plans ON subscription_plans
  FOR ALL
  USING (is_current_user_super_admin())
  WITH CHECK (is_current_user_super_admin());

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
  v_tenant RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Profile or tenant not found.';
  END IF;

  SELECT subscription_status, subscription_expires_at INTO v_tenant FROM tenants WHERE id = v_tenant_id;
  IF v_tenant.subscription_status = 'suspended' THEN
    RAISE EXCEPTION 'Store subscription is suspended. Please contact platform support.';
  END IF;

  IF v_tenant.subscription_expires_at IS NOT NULL AND v_tenant.subscription_expires_at < now() THEN
    RAISE EXCEPTION 'Store subscription has expired. Please renew plan to continue sales.';
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
