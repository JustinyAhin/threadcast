-- Create "local_auth_code" table
CREATE TABLE `local_auth_code` (
  `id` text NOT NULL,
  `code_hash` text NOT NULL,
  `user_id` text NOT NULL,
  `github_username` text NOT NULL,
  `github_avatar_url` text NOT NULL,
  `expires_at` integer NOT NULL,
  `consumed_at` integer NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "local_auth_code_code_hash_unique" to table: "local_auth_code"
CREATE UNIQUE INDEX `local_auth_code_code_hash_unique` ON `local_auth_code` (`code_hash`);
-- Create "local_auth_token" table
CREATE TABLE `local_auth_token` (
  `id` text NOT NULL,
  `token_hash` text NOT NULL,
  `user_id` text NULL,
  `github_username` text NOT NULL,
  `github_avatar_url` text NOT NULL,
  `expires_at` integer NOT NULL,
  `last_used_at` integer NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "local_auth_token_token_hash_unique" to table: "local_auth_token"
CREATE UNIQUE INDEX `local_auth_token_token_hash_unique` ON `local_auth_token` (`token_hash`);
