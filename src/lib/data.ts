'use server'

import { db } from '~/server/db';
import { chat_messages } from '~/server/db/schema';
import { eq, desc } from 'drizzle-orm'

export async function deleteMessage(id: string): Promise<void> {
    console.log("deleteMessage", id)
    await db.delete(chat_messages).where(eq(chat_messages.id, id))
}

export async function deleteLastMessage(chatId: string): Promise<void> {
    console.log("delete last msg")
    const [lastMessage] = await db
        .select()
        .from(chat_messages)
        .where(eq(chat_messages.chatId, chatId))
        .orderBy(desc(chat_messages.createdAt))
        .limit(1);

    if (lastMessage && lastMessage.role === 'assistant') {
        await db.delete(chat_messages).where(eq(chat_messages.id, lastMessage.id));
        console.log("Deleted message:", lastMessage.id);
    } else {
        console.log("last message is not by assistant, did not delete")
    }
}