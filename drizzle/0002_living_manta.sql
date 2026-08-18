CREATE TABLE `document_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewerId` varchar(64) NOT NULL,
	`reviewerName` varchar(160) NOT NULL,
	`documentId` varchar(100) NOT NULL,
	`openedAt` timestamp,
	`downloadedAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_reviewer_unique` UNIQUE(`reviewerId`,`documentId`)
);
