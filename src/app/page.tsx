'use client';

import { useChat } from '@ai-sdk/react';

// Simple Spinner component, can replace later
function Spinner() {
    return <span>Loading...</span>;
}

export default function Page() {
    const { messages, setMessages, input, handleInputChange, handleSubmit, status, stop, error, reload } = useChat({
        onFinish: (message, { usage, finishReason }) => {
            console.log('Finished streaming message:', message);
            console.log('Token usage:', usage);
            console.log('Finish reason:', finishReason);
        },
        onError: error => {
            console.error('An error occurred:', error);
        },
        onResponse: response => {
            console.log('Received HTTP response from server:', response);
        },
    });
    console.log(error)

    const handleDelete = (id: string) => {
        // can think of messages and setMessages as a pair of state and setState in React
        setMessages(messages.filter(message => message.id !== id))
    }

    // custom input,  use more granular APIs like setInput and append with your custom input and submit button components: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#controlled-input

    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#custom-headers-body-and-credentials
    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#custom-headers-body-and-credentials
    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#image-generation
    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#attachments-experimental

    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center ">
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
                    {messages.map(message => (
                        <div key={message.id}>
                            {message.role === 'user' ? 'User: ' : 'AI: '}
                            {message.content}
                            <button onClick={() => handleDelete(message.id)} className='p-1'>Delete</button>
                        </div>
                    ))}

                    {(status === 'submitted' || status === 'streaming') && (
                        <div>
                            {status === 'submitted' && <Spinner />}
                            <button type="button" onClick={() => stop()}>
                                Stop
                            </button>
                        </div>
                    )}

                    {error && (
                        <>
                            <div>An error occurred.</div>
                            <button type="button" onClick={() => reload()}>
                                Retry
                            </button>
                        </>
                    )}

                    {((status === 'ready' || status === 'error')) && <button onClick={() => reload()} disabled={!(status === 'ready' || status === 'error')}>Regenerate</button>}


                    <form onSubmit={handleSubmit}>
                        <input name="prompt" value={input} onChange={handleInputChange} disabled={status !== 'ready' || error != null} className='border' />
                        <button type="submit">Submit</button>
                    </form>

                </div>
            </main>
        </>
    );
}
