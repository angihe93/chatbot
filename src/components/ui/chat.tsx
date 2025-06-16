'use client';

import { createIdGenerator } from 'ai';
import { type Message, useChat } from '@ai-sdk/react';
import { deleteLastMessage, deleteMessage } from '~/lib/data';
import { useEffect, useRef } from 'react';
// import getEvents from '~/lib/eventsApi';
import { CircleX, RotateCcw } from 'lucide-react';
import ReactMarkdown from "react-markdown"

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
    // console.log("Chat id", id)
    const formRef = useRef<HTMLFormElement>(null);

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
        // this last message doesn't work reliably when a message is from a tool call
        // switch to delete latest message for this chat id
        const lastMsgId = messages[messages.length - 1]?.id
        if (lastMsgId) {
            console.log(`about to remove msg ${lastMsgId} and reload`)
            try {
                // await deleteMessage(lastMsgId)
                await deleteLastMessage(id!)
                await reload()
            } catch (error) { } finally { }
        }
    }

    useEffect(() => console.log(messages), [messages])

    // tutorial 3
    return (
        <>
            <div className="container flex flex-col items-center justify-center gap-6 px-10 py-16">
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
                                    case 'text': {
                                        // console.log("return text", part.text)
                                        // return message.id + part.text;
                                        return <div key={index}>
                                            {/* use custom component styling */}
                                            {/* https://github.com/remarkjs/react-markdown?tab=readme-ov-file#appendix-b-components */}
                                            {/* https://github.com/remarkjs/react-markdown/issues/832 */}
                                            <ReactMarkdown components={{
                                                ol({ children }) {
                                                    return <ol className="list-inside list-decimal">{children}</ol>
                                                },
                                                ul({ children }) {
                                                    return <ul className="list-inside list-disc">{children}</ul>
                                                },
                                                a: ({ node, ...props }) => (
                                                    <a {...props} className="underline text-blue-600 hover:text-blue-800" />
                                                ),
                                            }}>
                                                {part.text}
                                            </ReactMarkdown>
                                        </div>
                                    }

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
                                            case 'getEvents': {
                                                switch (part.toolInvocation.state) {
                                                    case 'partial-call':
                                                        return (
                                                            <div key={callId}>
                                                                Getting events info for {typeof part.toolInvocation.args === "object" &&
                                                                    part.toolInvocation.args !== null &&
                                                                    "query" in part.toolInvocation.args
                                                                    ? (part.toolInvocation.args as { query: string }).query
                                                                    : null}:{' '}...
                                                                {/* {part.toolInvocation.query} */}
                                                            </div>
                                                        );
                                                }
                                                if (part.toolInvocation.state === 'result') {
                                                    console.log("toolInvoation.result", part.toolInvocation.result);
                                                }
                                                return (
                                                    <div key={callId}>
                                                        <p>{part.toolInvocation.args}</p>
                                                        {part.toolInvocation.state === 'result' && (
                                                            // <p>{part.toolInvocation.result}</p>
                                                            <ReactMarkdown>{part.toolInvocation.result}</ReactMarkdown>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            case 'addResource': {
                                                switch (part.toolInvocation.state) {
                                                    case 'partial-call':
                                                        // const toolInvocation = part.toolInvocation as { toolName: string; state: string; args?: any; result?: any; toolCallId?: string }
                                                        const toolInvocation = part.toolInvocation as { toolName: string; state: string; toolCallId?: string }
                                                        return (
                                                            <div key={callId}>
                                                                {/* called {part.toolInvocation?.args?.toolName} */}
                                                                called {toolInvocation.toolName}
                                                            </div>
                                                        )
                                                }
                                            }
                                        }
                                        // switch (part.toolInvocation.state) {
                                        //     case 'partial-call':
                                        //         return <>render partial tool call</>;
                                        //     case 'call':
                                        //         return <>render full tool call</>;
                                        //     case 'result':
                                        //         return <>render tool result</>;
                                        // }
                                    }
                                    default:
                                        return null;
                                }
                            })}
                            {status === 'ready' &&
                                <div className='flex justify-end'>
                                    <button onClick={() => { void deleteMessage(message.id); setMessages(messages.filter(m => m.id !== message.id)) }}
                                        className="p-1 flex items-center gap-1 hover:text-red-700 text-sm">
                                        <CircleX />
                                        Delete
                                    </button></div>}
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
                        <button type="button" onClick={() => reload()}
                            className="p-1 flex items-center gap-1 hover:text-green-700 text-sm"
                        >
                            Retry
                            <RotateCcw />
                        </button>
                    </>
                )}

                {(status === 'ready' && messages.length > 0) &&
                    <div className="flex justify-end">
                        <button onClick={async () => { try { await handleReload() } catch (error) { } finally { } }}
                            disabled={!(status === 'ready')}
                            className="p-1 flex items-center gap-1 hover:text-green-700 text-sm">
                            <RotateCcw />
                            Regenerate
                        </button>
                    </div>}

                <form ref={formRef} onSubmit={handleSubmit}>
                    {/* <input value={input} onChange={handleInputChange} className='border' /> */}
                    {/* auto expand text box to fit input text: */}
                    <div className='w-[60vw]'>
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            className="border w-full resize-none overflow-hidden rounded-md p-2"
                            rows={1}
                            onInput={e => {
                                e.currentTarget.style.height = "auto";
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                            }}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    // handleSubmit(e as any)
                                    formRef.current?.requestSubmit()
                                }
                            }}
                        />
                        {/* {<button><ArrowUp /></button>} */}
                    </div>
                </form>
            </div>
        </>
    );
}
