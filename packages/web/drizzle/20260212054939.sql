-- Create "account" table
CREATE TABLE `account` (
  `id` text NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL,
  `access_token` text NULL,
  `refresh_token` text NULL,
  `id_token` text NULL,
  `access_token_expires_at` integer NULL,
  `refresh_token_expires_at` integer NULL,
  `scope` text NULL,
  `password` text NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "session" table
CREATE TABLE `session` (
  `id` text NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL,
  `ip_address` text NULL,
  `user_agent` text NULL,
  `user_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `0` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "session_token_unique" to table: "session"
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
-- Create "user" table
CREATE TABLE `user` (
  `id` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer NOT NULL,
  `image` text NULL,
  `github_username` text NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`id`)
);
-- Create index "user_email_unique" to table: "user"
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
-- Create "verification" table
CREATE TABLE `verification` (
  `id` text NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NULL,
  `updated_at` integer NULL,
  PRIMARY KEY (`id`)
);
