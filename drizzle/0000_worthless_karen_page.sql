CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`mime` text NOT NULL,
	`sender` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`host_hash` text NOT NULL,
	`join_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`joined_at` integer,
	`device_name` text,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_host_hash_unique` ON `sessions` (`host_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_join_hash_unique` ON `sessions` (`join_hash`);