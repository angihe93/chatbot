'use client';

import { createIdGenerator } from 'ai';
import { type Message, useChat } from '@ai-sdk/react';
import { deleteMessage } from '~/lib/data';
import { useEffect, useState } from 'react';

// Simple Spinner component, can replace later
function Spinner() {
    return <span>Loading...</span>;
}

export default function Chat({
    id,
    initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {

    // const [lastMsgId, setLastMsgId] = useState<string | undefined>('') // for delete previous msg in DB if user regenerates
    // useEffect(() => console.log(lastMsgId), [lastMsgId])

    const { input, handleInputChange, handleSubmit, messages, setMessages, addToolResult, status, stop, error, reload } = useChat({
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
        maxSteps: 5,
        async onToolCall({ toolCall }) {
            if (toolCall.toolName === 'getLocation') {
                const cities = [
                    'New York',
                    'Los Angeles',
                    'Chicago',
                    'San Francisco',
                ];
                return cities[Math.floor(Math.random() * cities.length)];
            }
        },
    });

    const handleReload = async () => {
        const lastMsgId = messages[messages.length - 1]?.id
        if (lastMsgId) {
            console.log(lastMsgId)
            try {
                await deleteMessage(lastMsgId)
                await reload()
            } catch (error) { } finally { }
        }
    }

    // simplified rendering code, extend as needed:
    // return (
    //     <main className="flex min-h-screen flex-col items-center justify-center ">
    //         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
    //             messages
    //             {messages.map(m => (
    //                 <div key={m.id}>
    //                     <strong>{m.role === 'user' ? 'User: ' : 'AI: '}</strong>
    //                     {m.content}
    //                 </div>
    //             ))}

    //             <form onSubmit={handleSubmit}>
    //                 {/* press enter to submit */}
    //                 <input value={input} onChange={handleInputChange} className='border' />
    //             </form>
    //         </div>
    //     </main>
    // );

    // tutorial 3
    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center ">
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
                    messages
                    {messages?.sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime())
                        .map(message => (
                            <div key={message.id}>
                                <strong>{`${message.role}: `}</strong>
                                {message.parts.map((part, index) => {
                                    switch (part.type) {
                                        case 'step-start':
                                            // show step boundaries as horizontal lines:
                                            return index > 0 ? (
                                                <div key={index} className="text-gray-500">
                                                    <hr className="my-2 border-gray-300" />
                                                </div>
                                            ) : null;

                                        // render text parts as simple text:
                                        // print out id for now for debugging
                                        case 'text':
                                            return message.id + part.text;

                                        // for tool invocations, distinguish between the tools and the state:
                                        case 'tool-invocation': {
                                            const callId = part.toolInvocation.toolCallId;

                                            switch (part.toolInvocation.toolName) {
                                                case 'askForConfirmation': {
                                                    switch (part.toolInvocation.state) {
                                                        case 'call':
                                                            return (
                                                                <div key={callId}>
                                                                    {/* {part.toolInvocation.args.message} */}
                                                                    {typeof part.toolInvocation.args === "object" &&
                                                                        part.toolInvocation.args !== null &&
                                                                        "message" in part.toolInvocation.args
                                                                        ? (part.toolInvocation.args as { message: string }).message
                                                                        : null}
                                                                    <div>
                                                                        <button
                                                                            onClick={() =>
                                                                                addToolResult({
                                                                                    toolCallId: callId,
                                                                                    result: 'Yes, confirmed.',
                                                                                })
                                                                            }
                                                                        >
                                                                            Yes
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                addToolResult({
                                                                                    toolCallId: callId,
                                                                                    result: 'No, denied',
                                                                                })
                                                                            }
                                                                        >
                                                                            No
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        case 'result':
                                                            return (
                                                                <div key={callId}>
                                                                    Location access allowed:{' '}
                                                                    {part.toolInvocation.result}
                                                                </div>
                                                            );
                                                    }
                                                    break;
                                                }

                                                case 'getLocation': {
                                                    switch (part.toolInvocation.state) {
                                                        case 'call':
                                                            return <div key={callId}>Getting location...</div>;
                                                        case 'result':
                                                            return (
                                                                <div key={callId}>
                                                                    Location: {part.toolInvocation.result}
                                                                </div>
                                                            );
                                                    }
                                                    break;
                                                }

                                                case 'getWeatherInformation': {
                                                    switch (part.toolInvocation.state) {
                                                        // example of pre-rendering streaming tool calls:
                                                        case 'partial-call':
                                                            return (
                                                                <pre key={callId}>
                                                                    {JSON.stringify(part.toolInvocation, null, 2)}
                                                                </pre>
                                                            );
                                                        case 'call':
                                                            return (
                                                                <div key={callId}>
                                                                    Getting weather information for{' '}
                                                                    {typeof part.toolInvocation.args === "object" &&
                                                                        part.toolInvocation.args !== null &&
                                                                        "city" in part.toolInvocation.args
                                                                        ? (part.toolInvocation.args as { city: string }).city
                                                                        : null}...
                                                                    {/* {part.toolInvocation.args.city}... */}
                                                                </div>
                                                            );
                                                        case 'result':
                                                            return (
                                                                <div key={callId}>
                                                                    Weather in {typeof part.toolInvocation.args === "object" &&
                                                                        part.toolInvocation.args !== null &&
                                                                        "city" in part.toolInvocation.args
                                                                        ? (part.toolInvocation.args as { city: string }).city
                                                                        : null}:{' '}
                                                                    {part.toolInvocation.result}
                                                                </div>
                                                            );
                                                    }
                                                    break;
                                                }
                                            }
                                            switch (part.toolInvocation.state) {
                                                case 'partial-call':
                                                    return <>render partial tool call</>;
                                                case 'call':
                                                    return <>render full tool call</>;
                                                case 'result':
                                                    return <>render tool result</>;
                                            }
                                        }
                                        default:
                                            return null;
                                    }
                                })}
                                {status === 'ready' &&
                                    <button onClick={() => { void deleteMessage(message.id); setMessages(messages.filter(m => m.id !== message.id)) }} className='p-1'>Delete</button>}
                                <br />
                            </div>
                        ))}

                    {/* when is saveChat called? if stop is clicked when message is generating would user prompt be saved? */}
                    {(status === 'submitted' || status === 'streaming') && (
                        <div>
                            {status === 'submitted' && <Spinner />}
                            <button type="button" onClick={() => stop()}>
                                Stop
                            </button>
                        </div>
                    )}

                    {/* TODO: for reload need to update existing db row */}
                    {error && (
                        <>
                            <div>An error occurred.</div>
                            <button type="button" onClick={() => reload()}>
                                Retry
                            </button>
                        </>
                    )}

                    {/* {(status === 'ready') && <button onClick={() => { setLastMsgId(messages[messages.length - 1]?.id); reload() }} disabled={!(status === 'ready')}>Regenerate</button>} */}
                    {(status === 'ready') && <button onClick={async () => { try { await handleReload() } catch (error) { } finally { } }} disabled={!(status === 'ready')}>Regenerate</button>}

                    <form onSubmit={handleSubmit}>
                        <input value={input} onChange={handleInputChange} className='border' />
                    </form>
                </div>
            </main>
        </>
    );
}
