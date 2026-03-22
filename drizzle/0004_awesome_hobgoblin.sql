CREATE TABLE `channel_user_subscriptions` (
	`line_channel_id` text NOT NULL,
	`line_user_id` text NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`plan_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`line_channel_id`, `line_user_id`),
	FOREIGN KEY (`line_channel_id`) REFERENCES `line_channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `line_channels` ADD `user_payment_required` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `line_channels` ADD `user_plan_id` text REFERENCES `plans`(`id`);
--> statement-breakpoint
ALTER TABLE `plans` ADD `plan_type` text DEFAULT 'channel' NOT NULL;
