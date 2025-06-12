import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { type Message } from '@ai-sdk/react';
import { createChatDB, findChatDB, loadChatDB, saveChatDB } from '~/server/db/db';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';


// Our example chat store implementation uses files to store the chat messages. In a real-world application, you would use a database or a cloud storage service, and get the chat ID from the database. That being said, the function interfaces are designed to be easily replaced with other implementations.

// export async function createChat(): Promise<string> {
//     const id = generateId(); // generate a unique chat ID
//     await writeFile(getChatFile(id), '[]'); // create an empty chat file
//     return id;
// }

export async function findOrCreateChat(): Promise<string> {

    // Get user authentication status
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        console.log("User not authenticated, redirecting to login");
        redirect('/login')
        // return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Log authentication status
    console.log('=== createChat REQUEST AUTH STATUS ===');
    if (session?.user) {
        console.log('✅ User authenticated:', {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            timestamp: new Date().toISOString(),
        });
    } else {
        console.log('❌ User not authenticated', {
            timestamp: new Date().toISOString(),
        });

        redirect('/login')
    }
    console.log('==================================');

    const userId = session.user.id
    const chatId = await findChatDB(userId)

    if (typeof chatId !== 'string') {
        const id = generateId(); // generate a unique chat ID
        const chat = await createChatDB(id, userId)
        console.log("no chat for user, created chat", chat.id)
        return chat.id
    }
    else {
        console.log("found chat for user, chatId", chatId)
        return chatId
    }
}

// function getChatFile(id: string): string {
//     const chatDir = path.join(process.cwd(), '.chats');
//     if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
//     return path.join(chatDir, `${id}.json`);
// }

// export async function loadChat(id: string): Promise<Message[]> {
//     return JSON.parse(await readFile(getChatFile(id), 'utf8'));
// }

export async function loadChat(id: string): Promise<Message[]> {
    const messages = await loadChatDB(id)
    return messages as Message[]
}

// export async function saveChat({
//     id,
//     messages,
// }: {
//     id: string;
//     messages: Message[];
// }): Promise<void> {
//     const content = JSON.stringify(messages, null, 2);
//     await writeFile(getChatFile(id), content);
// }

export async function saveChat({
    id,
    messages,
}: {
    id: string;
    messages: Message[];
}): Promise<void> {
    await saveChatDB(id, messages)
}
