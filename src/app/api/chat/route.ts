import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage, appendResponseMessages, appendClientMessage, createIdGenerator, type Message } from 'ai';
import { loadChat, saveChat } from '../../../tools/chat-store';
import { z } from 'zod'
import { DateType, type EventSearchParams } from '~/lib/eventsApiTypes';
import getEvents from '~/lib/eventsApi';
import { createResource } from '~/lib/actions/resources';
import { type NewResourceParams, insertResourceSchema } from "~/server/db/schema";
import { findRelevantContent } from '~/lib/ai/embedding';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const tools = {
    // server-side tool with execute function:
    getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({ }: { city: string }) => {
            const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
            return weatherOptions[
                Math.floor(Math.random() * weatherOptions.length)
            ];
        },
    },
    searchEvents: {
        description: 'call the getEvents API and return results to the user',
        parameters: z.object({
            start: z.number().optional(),
            query: z.string(),
            date: z.nativeEnum(DateType).optional(),
            is_virtual: z.boolean().optional(),
        }),
        execute: async (parameters: EventSearchParams) => {
            // console.log("searchEvents params", parameters)
            const sendParams = {
                ...parameters,
                date: parameters.date !== undefined ? DateType[parameters.date] : undefined
            };
            console.log("searchEvents paramsToSend", sendParams)
            const result = await getEvents(parameters)
            return { ...result, data: result.data.map(event => ({ name: event.name, description: event.description, date_human_readable: event.date_human_readable, link: event.link })) }
            // return await getEvents(parameters);
        }
    },
    // client-side tool that starts user interaction:
    askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
            message: z.string().describe('The message to ask for confirmation.'),
        }),
    },
    // client-side tool that is automatically executed on the client:
    getLocation: {
        description:
            'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({}),
    },
    addResource: {
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
            content: z
                .string()
                .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }: { content: string }) => createResource({ content }),
    },
    getInformation: {
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
            question: z.string().describe('the users question'),
        }),
        execute: async ({ question }: { question: string }) => findRelevantContent(question),
    },
}


function errorHandler(error: unknown) {
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
}

export async function POST(req: Request) {

    // Get user authentication status
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        console.log("User not authenticated, redirecting to login");
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Log authentication status
    console.log('=== POST CHAT API REQUEST AUTH STATUS ===');
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
    }
    console.log('==================================');


    // const { messages, id } = await req.json() //as { messages: CoreMessage[] }
    // get the last message from the client:
    // const { message_, id_ } = await req.json();
    // console.log(message_)
    let body: unknown;
    try { // works for tutorial 2 format
        console.log("try")
        body = await req.json();
        if (
            typeof body !== "object" ||
            body === null ||
            !("message" in body) ||
            !("id" in body) ||
            typeof (body as Record<string, unknown>).id !== "string" ||
            typeof (body as Record<string, unknown>).message !== "object"
        ) {
            throw new Error("Invalid request body");
        }
        const { message, id } = body as { message: Message; id: string };
        // const { message, id } = await req.json() as { message: Message; id: string };
        console.log(typeof message, message)
        if (typeof id !== "string") {
            throw new Error("Invalid id")
            // return new Response("Invalid id", { status: 400 });
        }

        if (typeof message !== "object") {
            throw new Error("Invalid message")
            // return new Response("Invalid message", { status: 400 });

        }

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
            // system: 'You are a helpful assistant.',
            system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
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
            tools: tools,
            toolCallStreaming: true,
            maxSteps: 5
        });

        // consume the stream to ensure it runs to completion & triggers onFinish
        // even when the client response is aborted:
        void result.consumeStream(); // no await

        return result.toDataStreamResponse({
            sendReasoning: true, // Some models such as as DeepSeek deepseek-reasoner and Anthropic claude-3-7-sonnet-20250219 support reasoning tokens
            getErrorMessage: errorHandler
        })

    } catch (error) { // works for tutorial 1 format
        console.log("catch")
        console.error(error);
        // const messages = Array.isArray(body?.messages) ? body.messages : [];
        const messages =
            typeof body === "object" &&
                body !== null &&
                "messages" in body &&
                Array.isArray((body as Record<string, unknown>).messages)
                ? (body as { messages: Message[] }).messages
                : [];
        // const { messages } = await req.json() as { messages: CoreMessage[] }
        console.log(typeof messages, messages)
        const result = streamText({
            // model: openai('gpt-4-turbo'),
            model: openai('gpt-4o'),
            system: 'You are a helpful assistant.',
            messages: messages,
            tools: tools,
            toolCallStreaming: true,
            maxSteps: 5
        });

        return result.toDataStreamResponse({
            sendReasoning: true, // Some models such as as DeepSeek deepseek-reasoner and Anthropic claude-3-7-sonnet-20250219 support reasoning tokens
            getErrorMessage: errorHandler
        });

    }
}
