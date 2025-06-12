CREATE TABLE "my-chatbot_account" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"accountId" varchar(256) NOT NULL,
	"providerId" varchar(256) NOT NULL,
	"userId" varchar(256) NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "my-chatbot_session" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" varchar(256) NOT NULL,
	CONSTRAINT "my-chatbot_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "my-chatbot_verification" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "my-chatbot_account" ADD CONSTRAINT "my-chatbot_account_userId_my-chatbot_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."my-chatbot_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my-chatbot_session" ADD CONSTRAINT "my-chatbot_session_userId_my-chatbot_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."my-chatbot_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my-chatbot_user" ADD CONSTRAINT "my-chatbot_user_email_unique" UNIQUE("email");