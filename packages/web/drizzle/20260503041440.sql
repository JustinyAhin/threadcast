-- Create index "account_provider_account_unique" to table: "account"
CREATE UNIQUE INDEX `account_provider_account_unique` ON `account` (`provider_id`, `account_id`);
-- Add column "github_id" to table: "user"
ALTER TABLE `user` ADD COLUMN `github_id` text NULL;
-- Create index "user_github_id_unique" to table: "user"
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);
-- Add column "github_id" to table: "local_auth_code"
ALTER TABLE `local_auth_code` ADD COLUMN `github_id` text NULL;
-- Add column "github_id" to table: "local_auth_token"
ALTER TABLE `local_auth_token` ADD COLUMN `github_id` text NULL;
