// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator, jsonb, text, foreignKey, vector } from "drizzle-orm/pg-core";
import { nanoid } from "~/lib/utils";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `my-chatbot_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const chats = createTable(
  "chat",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  })
)

export const chat_messages = createTable(
  "chat_message",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    role: d.varchar({ length: 256 }).notNull(),
    content: d.text().notNull(),
    parts: jsonb("parts").notNull(),
    chatId: d.varchar({ length: 256 })
  }),
  (t) => [
    foreignKey({ columns: [t.chatId], foreignColumns: [chats.id] }),
  ],
)

// RAG tutorial
export const resources = createTable(
  "resource",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    content: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
)

export const embeddings = createTable(
  "embedding",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey().$defaultFn(() => nanoid()),
    resourceId: d.varchar({ length: 256 }).references(() => resources.id, { onDelete: "cascade" }),
    content: d.text().notNull(), // the plain text chunk
    embedding: d.vector({ dimensions: 1536 }) // the vector representation of the plain text chunk
  }),
  (t) => [
    // To perform similarity search, you also need to include an index (HNSW or IVFFlat) on this column for better performance
    index('embeddingIndex').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ]
)