import { loadChat } from '../../../tools/chat-store';
import Chat from '../../../components/ui/chat';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { findChatDB } from '~/server/db/db';


export default async function Page(props: { params: Promise<{ id: string }> }) {
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
    console.log('=== /chat/[id] REQUEST AUTH STATUS ===');
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


    const { id } = await props.params; // get the chat ID from the URL
    console.log("chat id from params", id)
    // check if user has this chat, if not, redirect to /chat
    const userId = session.user.id
    const chatId = await findChatDB(userId)
    console.log('found chatId', chatId)
    if (typeof chatId !== 'string') {
        console.log("typeof chatId !== 'string', redirect to /chat")
        redirect('/chat')
    }
    else if (chatId !== id) {
        console.log("chatId !== id, redirect to /chat")
        redirect('/chat')
    }
    else {
        console.log("user has chat with this id, loadChat")
        const messages = await loadChat(id); // load the chat messages
        return <Chat id={id} initialMessages={messages} />; // display the chat
    }

}


