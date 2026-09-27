CREATE OR REPLACE FUNCTION check_shop_code_available(p_shop_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM tenants WHERE shop_code = lower(trim(p_shop_code))
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION register_store(
  p_store_name TEXT,
  p_shop_code TEXT,
  p_full_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_normalized_code TEXT := lower(trim(p_shop_code));
  v_tenant_id UUID;
  v_existing_profile RECORD;
  v_existing_shop RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to register a store.';
  END IF;

  SELECT id INTO v_existing_profile FROM profiles WHERE id = v_user_id;
  IF v_existing_profile IS NOT NULL THEN
    RAISE EXCEPTION 'User profile already exists.';
  END IF;

  SELECT id INTO v_existing_shop FROM tenants WHERE shop_code = v_normalized_code;
  IF v_existing_shop IS NOT NULL THEN
    RAISE EXCEPTION 'This shop code is already registered. Please choose another one.';
  END IF;

  INSERT INTO tenants (
    name,
    slug,
    shop_code,
    plan_id,
    subscription_status,
    subscription_expires_at
  ) VALUES (
    p_store_name,
    v_normalized_code,
    v_normalized_code,
    'free',
    'active',
    now() + interval '30 days'
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO profiles (
    id,
    tenant_id,
    role_id,
    full_name,
    is_super_admin
  ) VALUES (
    v_user_id,
    v_tenant_id,
    'owner',
    p_full_name,
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'shop_code', v_normalized_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
