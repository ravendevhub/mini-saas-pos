CREATE TABLE IF NOT EXISTS founder_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  qr_code_url TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE founder_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_founder_payment_methods ON founder_payment_methods;
CREATE POLICY read_founder_payment_methods ON founder_payment_methods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS manage_founder_payment_methods ON founder_payment_methods;
CREATE POLICY manage_founder_payment_methods ON founder_payment_methods
  FOR ALL
  USING (is_current_user_super_admin())
  WITH CHECK (is_current_user_super_admin());

INSERT INTO founder_payment_methods (provider_name, account_name, account_number, instructions, display_order)
VALUES 
('KBZPay', 'U Raven (Founder)', '09790000001', 'Please include your shop code in the transfer note.', 1),
('WavePay', 'U Raven (Founder)', '09790000001', 'Please include your shop code in the transfer note.', 2)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS subscription_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  payment_method_id UUID REFERENCES founder_payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT NOT NULL,
  sender_name TEXT,
  sender_phone TEXT,
  transaction_ref TEXT,
  slip_url TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_requests_tenant ON subscription_payment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_requests_status ON subscription_payment_requests(status);

ALTER TABLE subscription_payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_subscription_payment_requests ON subscription_payment_requests;
CREATE POLICY read_subscription_payment_requests ON subscription_payment_requests
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );

DROP POLICY IF EXISTS insert_subscription_payment_requests ON subscription_payment_requests;
CREATE POLICY insert_subscription_payment_requests ON subscription_payment_requests
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );

DROP POLICY IF EXISTS update_subscription_payment_requests ON subscription_payment_requests;
CREATE POLICY update_subscription_payment_requests ON subscription_payment_requests
  FOR UPDATE
  USING (
    is_current_user_super_admin()
  )
  WITH CHECK (
    is_current_user_super_admin()
  );

CREATE OR REPLACE FUNCTION approve_subscription_request(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
  v_plan RECORD;
BEGIN
  IF NOT is_current_user_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Founder Admin privileges required.';
  END IF;

  SELECT * INTO v_req FROM subscription_payment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription request not found.';
  END IF;

  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Subscription request is already processed (status: %).', v_req.status;
  END IF;

  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_req.requested_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requested plan "%" not found.', v_req.requested_plan_id;
  END IF;

  UPDATE tenants
  SET plan_id = v_req.requested_plan_id,
      subscription_status = 'active',
      subscription_expires_at = now() + INTERVAL '30 days',
      updated_at = now()
  WHERE id = v_req.tenant_id;

  UPDATE subscription_payment_requests
  SET status = 'approved',
      admin_notes = p_admin_notes,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'tenant_id', v_req.tenant_id,
    'plan_id', v_req.requested_plan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_subscription_request(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
BEGIN
  IF NOT is_current_user_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Founder Admin privileges required.';
  END IF;

  SELECT * INTO v_req FROM subscription_payment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription request not found.';
  END IF;

  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Subscription request is already processed (status: %).', v_req.status;
  END IF;

  UPDATE subscription_payment_requests
  SET status = 'rejected',
      admin_notes = p_admin_notes,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
