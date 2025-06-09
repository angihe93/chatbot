import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage, appendResponseMessages, appendClientMessage, createIdGenerator, type Message } from 'ai';
import { loadChat, saveChat } from '../../../tools/chat-store';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    // const { messages, id } = await req.json() //as { messages: CoreMessage[] }
    // get the last message from the client:
    const { message, id } = await req.json() as { message: Message; id: string };
    if (typeof id !== "string")
        return new Response("Invalid id", { status: 400 });
    if (typeof message !== "object")
        return new Response("Invalid message", { status: 400 });

    // load the previous messages from the server:
    const previousMessages = await loadChat(id);

    // append the new message to the previous messages:
    const messages = appendClientMessage({
        messages: previousMessages,
        message,
    });

    const result = streamText({
        // model: openai('gpt-4-turbo'),
        model: openai('gpt-4o'),
        system: 'You are a helpful assistant.',
        messages: messages,
        async onFinish({ response }) {
            await saveChat({
                id,
                messages: appendResponseMessages({
                    messages,
                    responseMessages: response.messages,
                }),
            });
        },
        // id format for server-side messages:
        experimental_generateMessageId: createIdGenerator({
            prefix: 'msgs',
            size: 16,
        }),
    });

    // consume the stream to ensure it runs to completion & triggers onFinish
    // even when the client response is aborted:
    void result.consumeStream(); // no await

    return result.toDataStreamResponse({
        sendReasoning: true, // Some models such as as DeepSeek deepseek-reasoner and Anthropic claude-3-7-sonnet-20250219 support reasoning tokens
        getErrorMessage: error => {
            if (error == null) {
                return 'unknown error';
            }

            if (typeof error === 'string') {
                return error;
            }

            if (error instanceof Error) {
                return error.message;
            }

            return JSON.stringify(error);
        },
    })
}
