import { Link } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus } from 'lucide-react';

// Define the Notification type again here or import from context file
interface Actor { id: string; name: string; }
interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
    actor: Actor;
    postId?: string;
    read: boolean;
}

interface NotificationItemProps {
    notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
    const { actor, type, postId, read } = notification;

    const notificationDetails = () => {
        switch (type) {
            case 'LIKE':
                return {
                    icon: <Heart className="w-5 h-5 text-red-500" />,
                    text: <><strong>{actor.name}</strong> liked your post.</>,
                    link: `/post/${postId}` // Assuming you have a route like this
                };
            case 'COMMENT':
                return {
                    icon: <MessageSquare className="w-5 h-5 text-sky-500" />,
                    text: <><strong>{actor.name}</strong> commented on your post.</>,
                    link: `/post/${postId}`
                };
            case 'FOLLOW':
                return {
                    icon: <UserPlus className="w-5 h-5 text-green-500" />,
                    text: <><strong>{actor.name}</strong> started following you.</>,
                    link: `/profile/${actor.id}`
                };
            default:
                return { icon: null, text: 'New notification', link: '/' };
        }
    };

    const { icon, text, link } = notificationDetails();

    return (
        <Link to={link} className={`block p-3 hover:bg-gray-800 ${!read ? 'bg-gray-900' : ''}`}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <p className="text-sm text-gray-200">{text}</p>
                {!read && <div className="ml-auto w-2 h-2 rounded-full bg-sky-500 flex-shrink-0"></div>}
            </div>
        </Link>
    );
};