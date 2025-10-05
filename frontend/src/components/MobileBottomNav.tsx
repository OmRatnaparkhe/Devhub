import { Link } from "react-router-dom";
import { HomeLogo } from "@/components/logo/homelogo";
import { NotificationLogo } from "@/components/logo/notificationlogo";
import { MessagesLogo } from "@/components/logo/messageslogo";
import { BookMarkLogo } from "@/components/logo/bookmarklogo";
import { ProfileLogo } from "@/components/logo/profilelogo";
import { useNotifications } from "@/components/NotificationContext";
import { useUser } from "@clerk/clerk-react";

export const MobileBottomNav = () => {
    const { unreadMessageCount, unreadNotificationCount } = useNotifications();
    const { user } = useUser();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-top border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <div className="max-w-2xl mx-auto flex items-center justify-around py-3">
                <Link to="/homefeed" className="relative p-4" aria-label="Home">
                    <HomeLogo />
                </Link>
                <Link to="/notifications" className="relative p-4" aria-label="Notifications">
                    {unreadNotificationCount > 1 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-5 min-w-[18px] rounded-full bg-sky-500 px-1.5 text-[11px] text-white">
                            {unreadNotificationCount}
                        </span>
                    )}
                    <NotificationLogo />
                </Link>
                <Link to="/messages" className="relative p-4" aria-label="Messages">
                    {unreadMessageCount > 1 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-5 min-w-[18px] rounded-full bg-sky-500 px-1.5 text-[11px] text-white">
                            {unreadMessageCount}
                        </span>
                    )}
                    <MessagesLogo />
                </Link>
                <Link to="/bookmarks" className="relative p-4" aria-label="Bookmarks">
                    <BookMarkLogo />
                </Link>
                <Link to={`/profile/${user?.id ?? ''}`} className="relative p-4" aria-label="Profile">
                    <ProfileLogo />
                </Link>
            </div>
        </div>
    );
};

export default MobileBottomNav;

