import { db } from '~/server/db';
import { chat_messages, chats } from '~/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Message } from '@ai-sdk/react';

export async function createChatDB(id: string): Promise<typeof chats.$inferSelect> {
    const chat: typeof chats.$inferInsert = {
        id: id,
    }
    await db.insert(chats).values(chat)
    const [getChat] = await db.select().from(chats).where(eq(chats.id, id));
    if (!getChat) {
        throw new Error(`Chat with id ${id} not found after insertion.`);
    }
    return getChat;
}

export async function loadChatDB(id: string): Promise<typeof chat_messages.$inferSelect[]> {
    const getMessages = await db.select().from(chat_messages).where(eq(chat_messages.chatId, id))
    if (!getMessages) {
        throw new Error(`Chat with id ${id} not found after insertion.`);
    }
    return getMessages
}

export async function saveChatDB(id: string, messages: Message[]) {
    for (const m of messages) {
        const message: typeof chat_messages.$inferInsert = {
            id: m.id,
            role: m.role,
            content: m.content,
            parts: m.parts,
            chatId: id
        }
        try {
            await db.insert(chat_messages).values(message);
        } catch (error: any) {
            // Check for duplicate primary key error (Postgres: '23505')
            if (error.code === '23505') {
                continue;
            }
            throw error;
        }
    }
}
