import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import io, { type Socket } from 'socket.io-client';
import { backendUrl } from '@/config/api';

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

interface ChatUser {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
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

const ConversationsList = React.memo(({ users, onSelectUser, selectedUserId }: { users: ChatUser[], onSelectUser: (user: ChatUser) => void, selectedUserId: string | null }) => (
    <div className="w-full md:w-1/3 border-r border-gray-700 h-full overflow-y-auto scrollbar-hide">
        <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <ul>
            {users.length > 0 ? users.map(user => (
                <li key={user.id} onClick={() => onSelectUser(user)} className={`p-4 cursor-pointer hover:bg-gray-800 flex items-center space-x-3 relative ${selectedUserId === user.id ? 'bg-gray-800' : ''}`}>
                    {user.hasUnreadMessages && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 bg-sky-500 rounded-full"></div>
                    )}
                    <img src={user.profilePic || 'https://placehold.co/40x40'} alt={user.name} className="w-10 h-10 rounded-full ml-3" />
                    <div>
                        <p className={`font-semibold ${user.hasUnreadMessages ? 'text-white' : 'text-gray-200'}`}>{user.name}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                </li>
            )) : <p className="text-center text-gray-400 p-4">No users to message.</p>}
        </ul>
    </div>
));

const ChatWindow = React.memo(( { selectedUser, messages, onSendMessage, currentUserId, onBack }: { selectedUser: ChatUser, messages: Message[], onSendMessage: (content: string) => void, currentUserId: string, onBack?: () => void }) => {
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
        <div className="w-full md:w-2/3 flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
                {onBack && (
                    <button onClick={onBack} className="md:hidden mr-1 rounded-full p-2 hover:bg-gray-800" aria-label="Back">
                        <ArrowLeft size={20} />
                    </button>
                )}
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
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        if (currentUser?.id ?? "") {
            const socketInstance = io(`${backendUrl}`, {
                query: { userId: currentUser?.id ?? "" }
            });
            socket.current = socketInstance;

            socketInstance.on('newMessage', (newMessage: Message) => {
                const selected = selectedUserRef.current;
                if (selected && newMessage.senderId === selected.id) {
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                } else if (newMessage.senderId !== currentUser.id) {
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

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const fetchConversations = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await fetch(`${backendUrl}api/messages/conversations`, {
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

    const handleSelectUser = useCallback(async (user: ChatUser) => {
        setSelectedUser(user);
        setMessages([]);

        if (user.hasUnreadMessages) {
            setConversations(prevConvos =>
                prevConvos.map(convo =>
                    convo.id === user.id ? { ...convo, hasUnreadMessages: false } : convo
                )
            );
        }

        if (messagesRequestRef.current) {
            messagesRequestRef.current.abort();
        }
        const controller = new AbortController();
        messagesRequestRef.current = controller;

        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${backendUrl}api/messages/conversations/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            setMessages(data);

            fetch(`${backendUrl}api/messages/mark-read`, {
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
            await fetch(`${backendUrl}api/messages/send/${selectedUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
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
                    <main className="flex-1 min-h-0 flex border border-gray-700 rounded-lg overflow-hidden">
                        {isMobile ? (
                            selectedUser && currentUser ? (
                                <ChatWindow
                                    selectedUser={selectedUser}
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    currentUserId={currentUser.id}
                                    onBack={() => setSelectedUser(null)}
                                />
                            ) : (
                                <ConversationsList
                                    users={conversations}
                                    onSelectUser={handleSelectUser}
                                    selectedUserId={selectedUser?.id || null}
                                />
                            )
                        ) : (
                            <>
                                <ConversationsList users={conversations} onSelectUser={handleSelectUser} selectedUserId={selectedUser?.id || null} />
                                {selectedUser && currentUser ? (
                                    <ChatWindow selectedUser={selectedUser} messages={messages} onSendMessage={handleSendMessage} currentUserId={currentUser.id} />
                                ) : (
                                    <div className="w-2/3 flex items-center justify-center h-full bg-gray-900">
                                        <p className="text-gray-400">Select a conversation to start chatting.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};