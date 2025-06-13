'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import Chat from '~/components/ui/chat';
import { api } from "~/trpc/react"

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
    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#image-generation
    // https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#attachments-experimental

    // test hello procedure in src/server/api/routers/post.ts
    const trpcHelloResult = api.post.hello.useQuery({ text: 'world' })
    const chatIds = api.chat.list.useQuery()

    // referencing post.tsx
    const [selectedChat, setSelectedChat] = useState('')

    const createChat = api.chat.create.useMutation({
        onSuccess: async (data) => {
            setSelectedChat(data)
            console.log(`created chat ${data}`)
        },
    });

    const { data: chatData, isLoading: isChatLoading } = api.chat.load.useQuery(
        { chatId: selectedChat ?? "" },
        { enabled: !!selectedChat } // only run query if selectedChat is set
    );


    return (
        <>
            <main className="flex min-h-screen flex-col items-center justify-center ">
                <h3>{trpcHelloResult.data?.greeting}</h3>
                <button onClick={() => createChat.mutate()} disabled={createChat.isPending}>Start chatting</button>

                <p>Continue a previous chat:</p>
                {chatIds.data?.map((i) => <button key={i} onClick={() => setSelectedChat(i)}> {i} </button>)}
                {/* || createdChat */}
                {selectedChat && (
                    isChatLoading ? (
                        <div>Loading chat...</div>
                    ) : chatData?.messages ? (
                        <Chat id={selectedChat} initialMessages={chatData.messages} />
                    ) : (
                        <div>No messages found.</div>
                    )
                )}
            </main>
        </>
    );
}
