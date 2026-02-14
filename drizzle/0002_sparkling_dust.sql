CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`image_url` text,
	`video_url` text,
	`link_url` text,
	`link_text` text,
	`metadata` text DEFAULT '{}',
	`page_id` text,
	`status` text DEFAULT 'unread' NOT NULL,
	`snoozed_until` integer,
	`created_at` integer NOT NULL,
	`read_at` integer,
	`archived_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `users` ADD `has_seen_tour` integer DEFAULT false NOT NULL;