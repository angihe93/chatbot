'use server'

import { db } from '~/server/db';
import { chat_messages } from '~/server/db/schema';
import { eq } from 'drizzle-orm'

export async function deleteMessage(id: string): Promise<void> {
    console.log("deleteMessage", id)
    await db.delete(chat_messages).where(eq(chat_messages.id, id))
}