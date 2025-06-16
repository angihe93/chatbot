CREATE TABLE "my-chatbot_resource" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
