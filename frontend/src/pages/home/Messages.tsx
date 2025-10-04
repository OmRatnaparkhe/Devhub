// Messages.tsx - Updated with Notification Features

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, Send } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import io, { type Socket } from 'socket.io-client';

// --- This style tag will hide the scrollbar ---
const CustomStyles = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
  `}</style>
);

// --- Type definitions ---
interface ChatUser {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
    // --- NEW ---: Property to track unread status for the UI indicator
    hasUnreadMessages?: boolean;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    sender: ChatUser;
}

// --- ConversationsList Component (memoized, same layout) ---
const ConversationsList = React.memo(({ users, onSelectUser, selectedUserId }: { users: ChatUser[], onSelectUser: (user: ChatUser) => void, selectedUserId: string | null }) => (
    <div className="w-1/3 border-r border-gray-700 h-full overflow-y-auto scrollbar-hide">
        <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <ul>
            {users.length > 0 ? users.map(user => (
                // --- UPDATE ---: Added 'relative' positioning for the dot and adjusted padding/margin
                <li key={user.id} onClick={() => onSelectUser(user)} className={`p-4 cursor-pointer hover:bg-gray-800 flex items-center space-x-3 relative ${selectedUserId === user.id ? 'bg-gray-800' : ''}`}>
                    {/* --- NEW ---: Unread message indicator dot */}
                    {user.hasUnreadMessages && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 bg-sky-500 rounded-full"></div>
                    )}
                    <img src={user.profilePic || 'https://placehold.co/40x40'} alt={user.name} className="w-10 h-10 rounded-full ml-3" /> {/* Added margin for dot space */}
                    <div>
                        <p className={`font-semibold ${user.hasUnreadMessages ? 'text-white' : 'text-gray-200'}`}>{user.name}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                </li>
            )) : <p className="text-center text-gray-400 p-4">No users to message.</p>}
        </ul>
    </div>
));

// --- ChatWindow Component (No changes) ---
const ChatWindow = React.memo(( { selectedUser, messages, onSendMessage, currentUserId }: { selectedUser: ChatUser, messages: Message[], onSendMessage: (content: string) => void, currentUserId: string }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    return (
        <div className="w-2/3 flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
                <img src={selectedUser.profilePic || 'https://placehold.co/40x40'} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                <div>
                    <h3 className="text-lg font-bold">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-900 scrollbar-hide">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-md ${msg.senderId === currentUserId ? 'bg-sky-600 text-white' : 'bg-gray-700'}`}>
                            {msg.content}
                            <div className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 rounded-full px-4 py-2 focus:outline-none text-white"
                />
                <button onClick={handleSend} className="ml-4 bg-sky-500 hover:bg-sky-600 rounded-full p-3 text-white">
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
});

// --- MessagesPage Component (optimized, same layout) ---
export const MessagesPage = () => {
    const { getToken } = useAuth();
    const { user: currentUser } = useUser();
    const [conversations, setConversations] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    //@ts-ignore
    const socket = useRef<Socket | null>(null);
    const selectedUserRef = useRef<ChatUser | null>(null);
    const messagesRequestRef = useRef<AbortController | null>(null);

    // Keep a ref of the selected user to avoid re-subscribing socket on selection changes
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    // Socket listener initialized once per currentUser
    useEffect(() => {
        if (currentUser?.id ?? "") {
            const socketInstance = io(`${import.meta.env.VITE_BACKEND_URL_PROD}`, {
                query: { userId: currentUser?.id ?? "" }
            });
            socket.current = socketInstance;

            socketInstance.on('newMessage', (newMessage: Message) => {
                const selected = selectedUserRef.current;
                if (selected && newMessage.senderId === selected.id) {
                    // Append to the current chat
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                } else if (newMessage.senderId !== currentUser.id) {
                    // Mark unread in conversations
                    setConversations(prevConvos =>
                        prevConvos.map(convo =>
                            convo.id === newMessage.senderId
                                ? { ...convo, hasUnreadMessages: true }
                                : convo
                        )
                    );
                }
            });

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [currentUser?.id]);

    // --- Initial data fetch (no changes here, backend handles a lot) ---
    useEffect(() => {
        const controller = new AbortController();
        const fetchConversations = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/messages/conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch conversations');
                const data = await res.json();
                setConversations(data);
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    console.error(error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
        return () => controller.abort();
    }, [getToken]);

    // --- UPDATE ---: handleSelectUser enhanced to mark messages as read
    const handleSelectUser = useCallback(async (user: ChatUser) => {
        setSelectedUser(user);
        setMessages([]);

        // Optimistically clear unread indicator
        if (user.hasUnreadMessages) {
            setConversations(prevConvos =>
                prevConvos.map(convo =>
                    convo.id === user.id ? { ...convo, hasUnreadMessages: false } : convo
                )
            );
        }

        // Cancel any in-flight messages request
        if (messagesRequestRef.current) {
            messagesRequestRef.current.abort();
        }
        const controller = new AbortController();
        messagesRequestRef.current = controller;

        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/messages/conversations/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            setMessages(data);

            // Mark as read (no need to await if you want max snappiness)
            fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/messages/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ senderId: user.id })
            }).catch(() => {});
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error(error);
            }
        }
    }, [getToken]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!selectedUser || !currentUser) return;
        const token = await getToken();
        if (!token) return;

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/messages/send/${selectedUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            // Message appears via socket listener
        } catch (error) {
            console.error('Failed to send message', error);
        }
    }, [selectedUser, currentUser, getToken]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-sky-500" /></div>;
    }

    return (
        <>
            <CustomStyles />
            <div className="flex justify-center h-screen bg-black text-white">
                <div className="hidden lg:block w-[250px] pr-4 pt-20">
                    <Sidebar />
                </div>
                <div className="w-full max-w-4xl pt-20 pb-5 flex flex-col">
                    <main className="flex-1 flex border border-gray-700 rounded-lg overflow-hidden h-[calc(100vh-100px)]">
                        <ConversationsList users={conversations} onSelectUser={handleSelectUser} selectedUserId={selectedUser?.id || null} />
                        {selectedUser && currentUser ? (
                            <ChatWindow selectedUser={selectedUser} messages={messages} onSendMessage={handleSendMessage} currentUserId={currentUser.id} />
                        ) : (
                            <div className="w-2/3 flex items-center justify-center h-full bg-gray-900">
                                <p className="text-gray-400">Select a conversation to start chatting.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};