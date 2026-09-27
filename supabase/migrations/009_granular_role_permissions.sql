ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS can_view_products    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_products  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_products    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_products  BOOLEAN NOT NULL DEFAULT false,

  ADD COLUMN IF NOT EXISTS can_view_sales       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_sales     BOOLEAN NOT NULL DEFAULT false,

  ADD COLUMN IF NOT EXISTS can_view_users       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_users     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_users     BOOLEAN NOT NULL DEFAULT false;

UPDATE roles SET
  can_view_products   = true,
  can_create_products = true,
  can_edit_products   = true,
  can_delete_products = true,
  can_view_sales      = true,
  can_delete_sales    = true,
  can_view_users      = true,
  can_create_users    = true,
  can_delete_users    = true
WHERE id = 'owner';

UPDATE roles SET
  can_view_products   = true,
  can_create_products = true,
  can_edit_products   = true,
  can_delete_products = true,
  can_view_sales      = true,
  can_delete_sales    = false,
  can_view_users      = true,
  can_create_users    = false,
  can_delete_users    = false
WHERE id = 'manager';

UPDATE roles SET
  can_view_products   = true,
  can_create_products = false,
  can_edit_products   = false,
  can_delete_products = false,
  can_view_sales      = false,
  can_delete_sales    = false,
  can_view_users      = false,
  can_create_users    = false,
  can_delete_users    = false
WHERE id = 'cashier';
