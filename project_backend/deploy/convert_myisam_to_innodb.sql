-- Fix for: errno 150 "Foreign key constraint is incorrectly formed" and
--          errno 1824 "Failed to open the referenced table '...'".
-- The legacy tables (imported from the SQL dump) are MyISAM, which cannot be
-- foreign-key targets. Convert every table to InnoDB so migrations apply.
-- Run against the BDM database (dev: bdm_demo, prod: your prod schema).
--
-- Safe: ALTER ... ENGINE=InnoDB preserves all data. Take a backup first anyway:
--   mysqldump -u <user> -p <db> > backup_before_innodb.sql
--
-- ============================================================================
-- RECOMMENDED (auto-detect): convert EVERY MyISAM table in the current DB.
-- The static list below can miss tables; this catches all of them.
-- Step 1 — generate the ALTER statements:
--   SELECT CONCAT('ALTER TABLE `', table_name, '` ENGINE=InnoDB;')
--   FROM information_schema.tables
--   WHERE table_schema = DATABASE() AND engine = 'MyISAM';
-- Step 2 — copy the output and run it (with FOREIGN_KEY_CHECKS = 0 around it).
--
-- Or as a one-liner from the shell (replace <db>):
--   mysql -u root -p -N -e "SELECT CONCAT('ALTER TABLE \`',table_name,'\` ENGINE=InnoDB;') FROM information_schema.tables WHERE table_schema='<db>' AND engine='MyISAM';" <db> > /tmp/to_innodb.sql
--   mysql -u root -p <db> -e "SET FOREIGN_KEY_CHECKS=0; SOURCE /tmp/to_innodb.sql; SET FOREIGN_KEY_CHECKS=1;"
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `accounts_address`                      ENGINE=InnoDB;
ALTER TABLE `accounts_area`                         ENGINE=InnoDB;
ALTER TABLE `accounts_district`                     ENGINE=InnoDB;
ALTER TABLE `accounts_userauth`                     ENGINE=InnoDB;
ALTER TABLE `accounts_userauth_groups`              ENGINE=InnoDB;
ALTER TABLE `accounts_userauth_user_permissions`    ENGINE=InnoDB;
ALTER TABLE `auth_group`                            ENGINE=InnoDB;
ALTER TABLE `auth_group_permissions`                ENGINE=InnoDB;
ALTER TABLE `auth_permission`                       ENGINE=InnoDB;
ALTER TABLE `django_content_type`                   ENGINE=InnoDB;
ALTER TABLE `django_migrations`                     ENGINE=InnoDB;
ALTER TABLE `django_session`                        ENGINE=InnoDB;
ALTER TABLE `notice_notice`                         ENGINE=InnoDB;
ALTER TABLE `notification_adminnotification`        ENGINE=InnoDB;
ALTER TABLE `notification_notification`             ENGINE=InnoDB;
ALTER TABLE `orders_order`                          ENGINE=InnoDB;
ALTER TABLE `products_bannerimages`                 ENGINE=InnoDB;
ALTER TABLE `products_category`                     ENGINE=InnoDB;
ALTER TABLE `products_company`                      ENGINE=InnoDB;
ALTER TABLE `products_genericname`                  ENGINE=InnoDB;
ALTER TABLE `products_product_category_id`          ENGINE=InnoDB;
ALTER TABLE `settings_siteinfomodel`                ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
