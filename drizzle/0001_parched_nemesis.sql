CREATE TABLE `portal_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`area` varchar(80) NOT NULL,
	`selection` varchar(240) NOT NULL,
	`note` text,
	`decisionStatus` enum('draft','approved','needs_discussion') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portal_decisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `decision_user_area_unique` UNIQUE(`userId`,`area`)
);
--> statement-breakpoint
CREATE TABLE `portal_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(160),
	`title` varchar(160),
	`seatNumber` int NOT NULL,
	`memberRole` enum('decision_maker') NOT NULL DEFAULT 'decision_maker',
	`memberStatus` enum('invited','active') NOT NULL DEFAULT 'invited',
	`invitedByUserId` int,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portal_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_members_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `portal_decisions` ADD CONSTRAINT `portal_decisions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portal_members` ADD CONSTRAINT `portal_members_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;