'use client';

import { createIdGenerator } from 'ai';
import { type Message, useChat } from '@ai-sdk/react';

export default function Chat({
    id,
    initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {
    const { input, handleInputChange, handleSubmit, messages } = useChat({
        id, // use the provided chat ID
        initialMessages, // initial messages if provided
        sendExtraMessageFields: true, // send id and createdAt for each message
        // id format for client-side messages:
        generateId: createIdGenerator({
            prefix: 'msgc',
            size: 16,
        }),
        // only send the last message to the server:
        experimental_prepareRequestBody({ messages, id }) {
            return { message: messages[messages.length - 1], id };
        },
    });

    // simplified rendering code, extend as needed:
    return (
        <main className="flex min-h-screen flex-col items-center justify-center ">
            <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
                messages
                {messages.map(m => (
                    <div key={m.id}>
                        {m.role === 'user' ? 'User: ' : 'AI: '}
                        {m.content}
                    </div>
                ))}

                <form onSubmit={handleSubmit}>
                    {/* press enter to submit */}
                    <input value={input} onChange={handleInputChange} className='border' />
                </form>
            </div>
        </main>
    );
}
