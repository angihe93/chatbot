CREATE TABLE "my-chatbot_embedding" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"resourceId" varchar(256),
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "my-chatbot_embedding" ADD CONSTRAINT "my-chatbot_embedding_resourceId_my-chatbot_resource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."my-chatbot_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "my-chatbot_embedding" USING hnsw ("embedding" vector_cosine_ops);