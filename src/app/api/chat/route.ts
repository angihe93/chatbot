import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json() as { messages: CoreMessage[] }
    const result = streamText({
        // model: openai('gpt-4-turbo'),
        model: openai('gpt-4o'),
        system: 'You are a helpful assistant.',
        messages: messages,
    });

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
