// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator, jsonb, text, foreignKey, vector } from "drizzle-orm/pg-core";
import { nanoid } from "~/lib/utils";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
    userId: d.varchar({ length: 256 }).references(() => users.id).notNull(),
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
    id: d.varchar({ length: 256 }).primaryKey().$defaultFn(() => nanoid()),
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

// Schema for resources - used to validate API requests
// export const insertResourceSchema = z.object({
//   content: z.string(), // check
// });
export const insertResourceSchema = createSelectSchema(resources)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

// Type for resources - used to type API request params and within Components
// export type NewResourceParams = z.infer<typeof insertResourceSchema>;
export type NewResourceParams = {
  content: string; // check
};


// Auth table for better auth
// https://www.better-auth.com/docs/concepts/database#user
// https://www.better-auth.com/docs/installation#create-database-tables
// schema from npx @better-auth/cli generate with slight mods to be compatible with existing schema
export const users = createTable(
  "user",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    name: d.varchar({ length: 256 }).notNull(),
    email: d.varchar({ length: 256 }).notNull().unique(),
    emailVerified: d.boolean().notNull().default(false),
    image: d.text(),
    createdAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  })
)

export const sessions = createTable(
  "session",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
    token: d.text().notNull().unique(),
    createdAt: d.timestamp({ withTimezone: true }).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).notNull(),
    ipAddress: d.text(),
    userAgent: d.text(),
    userId: d.varchar({ length: 256 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  })
)

export const accounts = createTable(
  "account",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    accountId: d.varchar({ length: 256 }).notNull(),
    providerId: d.varchar({ length: 256 }).notNull(),
    userId: d.varchar({ length: 256 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    idToken: d.text(),
    accessTokenExpiresAt: d.timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: d.timestamp({ withTimezone: true }),
    scope: d.text(),
    password: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).notNull(),
  })
)

export const verifications = createTable(
  "verification",
  (d) => ({
    id: d.varchar({ length: 256 }).primaryKey(),
    identifier: d.text().notNull(),
    value: d.text().notNull(),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
    createdAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: d.timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
  })
)

export const schema = {
  user: users, // <-- alias to match expected model name
  session: sessions,
  account: accounts,
  verification: verifications
}