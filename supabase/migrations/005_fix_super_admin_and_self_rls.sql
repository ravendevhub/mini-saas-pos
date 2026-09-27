DROP POLICY IF EXISTS tenant_isolation_profiles ON profiles;
CREATE POLICY tenant_isolation_profiles ON profiles
  FOR ALL
  USING (
    id = auth.uid() OR
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  )
  WITH CHECK (
    id = auth.uid() OR
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );

DROP POLICY IF EXISTS tenant_isolation_sales ON sales;
CREATE POLICY tenant_isolation_sales ON sales
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );

DROP POLICY IF EXISTS tenant_isolation_sale_items ON sale_items;
CREATE POLICY tenant_isolation_sale_items ON sale_items
  FOR ALL
  USING (
    is_current_user_super_admin() OR
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
        AND sales.tenant_id = get_current_user_tenant_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_products ON products;
CREATE POLICY tenant_isolation_products ON products
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() OR
    is_current_user_super_admin()
  );
