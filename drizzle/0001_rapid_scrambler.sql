CREATE TABLE "my-chatbot_chat_message" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"parts" jsonb NOT NULL,
	"chatId" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "my-chatbot_chat" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "my-chatbot_chat_message" ADD CONSTRAINT "my-chatbot_chat_message_chatId_my-chatbot_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."my-chatbot_chat"("id") ON DELETE no action ON UPDATE no action;