import { redirect } from 'next/navigation';
import { findOrCreateChat } from '../../tools/chat-store';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

// this is a react server component, not normal react client
// so it can do server features like talking to DB
export default async function Page() {
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
    console.log('=== /chat REQUEST AUTH STATUS ===');
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

    const id = await findOrCreateChat(); // find chat for userId, if it doesn't exist, create chat
    redirect(`/chat/${id}`); // redirect to chat page, see below
}
