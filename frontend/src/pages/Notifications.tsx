import { useEffect } from "react";
import { useNotifications } from "@/components/NotificationContext";
import { NotificationItem } from "@/components/NotificationItem";

const NotificationsPage = () => {
    const { notifications, unreadNotificationCount, markNotificationsAsRead } = useNotifications();

    useEffect(() => {
        if (unreadNotificationCount > 0) {
            markNotificationsAsRead();
        }
    }, [unreadNotificationCount, markNotificationsAsRead]);

    return (
        <div className="pt-20 pb-4">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-xl font-semibold mb-4">Notifications</h1>
                {notifications.length === 0 ? (
                    <p className="text-muted-foreground">No notifications yet.</p>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(n => (
                            <NotificationItem key={n.id} notification={n} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

