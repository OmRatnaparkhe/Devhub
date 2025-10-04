import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Make sure to install clerk-react if not already present: npm install @clerk/clerk-react
import { useAuth } from '@clerk/clerk-react';
// Make sure to install socket.io-client if not already present: npm install socket.io-client
import io from 'socket.io-client';

// --- Type Definitions ---

// 1. Define the structure of the Actor (user performing the action)
interface Actor {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
}

// 2. Define the structure of a single Notification object received from the API
interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
    read: boolean;
    createdAt: string;
    actor: Actor;
    postId?: string; // Optional: for linking directly to liked/commented posts
}

// 3. Define the shape of the data provided by this context
interface NotificationContextType {
    notifications: Notification[]; // List of non-message notifications (for popover)
    unreadMessageCount: number;      // Count for the "Messages" bubble
    unreadNotificationCount: number; // Count for the "Notifications" bubble
    markNotificationsAsRead: () => void; // Function to clear general notification bubble
}

// --- Context Creation ---
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provides notification state (counts and lists) to all child components.
 * Manages fetching initial data and listening for real-time updates via sockets.
 */
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { getToken, userId } = useAuth();

    // State for notification data
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    /**
     * Fetches initial notifications from the server and categorizes them.
     * Populates state variables for message count, notification count, and notification list.
     */
    const fetchNotifications = async () => {
        const token = await getToken();
        if (!token) return;

        try {
            // Fetch all notifications; filtering happens on the client side here.
            // Alternatively, create separate backend endpoints for counts for efficiency.
            const res = await fetch(`${process.env.BACKEND_URL_PROD}api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch notification data (${res.status} ${res.statusText})`);
            }
            
            const data = await res.json().catch(() => ({}));

            if (data.notifications && Array.isArray(data.notifications)) {
                let messageCount = 0;
                let notificationCount = 0;
                const generalNotifications: Notification[] = [];

                data.notifications.forEach((notification: Notification) => {
                    if (notification.type === 'MESSAGE') {
                        if (!notification.read) {
                            messageCount++;
                        }
                    } else {
                        generalNotifications.push(notification);
                        if (!notification.read) {
                            notificationCount++;
                        }
                    }
                });

                setUnreadMessageCount(messageCount);
                setUnreadNotificationCount(notificationCount);
                setNotifications(generalNotifications); // Store filtered list for notification popover
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // --- Initial Data Fetch Effect ---
    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId, getToken]); // Re-fetch if user changes

    // --- Real-time Update Effect (Socket.io) ---
    useEffect(() => {
        if (!userId) return;

        // Establish connection, passing userId for authentication/room joining on backend
        const socket = io(`${process.env.BACKEND_URL_PROD}`, { query: { userId } });

        // Listen for all new notification events (like, comment, follow, message)
        socket.on('new_notification', (newNotification: Notification) => {
            if (newNotification.type === 'MESSAGE') {
                // Increment message counter only
                setUnreadMessageCount(prevCount => prevCount + 1);
            } else {
                // Add to notification list and increment counter for other types
                setNotifications(prevList => [newNotification, ...prevList]);
                setUnreadNotificationCount(prevCount => prevCount + 1);
            }
        });
        
        // Listen for dedicated message events if your structure uses both
        // 'newMessage' for chat UI and 'new_notification' for counts.
        // If 'new_notification' handles messages, you can remove this duplicate listener.
        // socket.on('newMessage', () => { ... });

        return () => { socket.disconnect(); };
    }, [userId]);

    /**
     * Marks all general notifications as read on the server and updates UI state.
     * Called when the user opens the notification popover.
     */
    const markNotificationsAsRead = async () => {
        if (unreadNotificationCount === 0) return; // Avoid unnecessary API call

        const token = await getToken();
        if (!token) return;

        // Optimistic UI update: Clear count and mark items as read immediately locally.
        setUnreadNotificationCount(0);
        setNotifications(prevList => prevList.map(n => ({ ...n, read: true })));

        try {
            await fetch(`${process.env.BACKEND_URL_PROD}api/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            // TODO: Revert optimistic update on failure if critical
        }
    };

    // Provide state and functions to children components
    return (
        <NotificationContext.Provider 
            value={{ 
                notifications, 
                unreadMessageCount, 
                unreadNotificationCount, 
                markNotificationsAsRead 
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

// --- Custom Hook ---
/**
 * Custom hook to easily access notification context data from any component.
 * Ensures component is wrapped within NotificationProvider.
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};