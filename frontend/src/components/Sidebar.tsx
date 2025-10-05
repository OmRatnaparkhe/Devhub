import { useUser } from "@clerk/clerk-react";
import { BookMarkLogo } from "./logo/bookmarklogo";
import { HomeLogo } from "./logo/homelogo";
import { MessagesLogo } from "./logo/messageslogo";
import { NotificationLogo } from "./logo/notificationlogo";
import { ProfileLogo } from "./logo/profilelogo";
import { SidebarComponent } from "./SidebarComponents";
import { Link } from "react-router-dom";
import { useNotifications } from "./NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"; 
import { NotificationItem } from "./NotificationItem";
export function Sidebar() {
  const { user } = useUser();
  const { notifications,unreadMessageCount, unreadNotificationCount, markNotificationsAsRead } = useNotifications();

  return (
    <div className="space-y-2 pt-4">
      <Link to="/homefeed">
      <SidebarComponent name="Home" logo={<HomeLogo />} /></Link>
      
      
       <Popover onOpenChange={(isOpen) => {
          if (isOpen) {
            markNotificationsAsRead();
          }
      }}>
        <PopoverTrigger className="w-full text-left rounded-md hover:bg-accent focus:outline-none">
           <SidebarComponent 
             name="Notifications" 
             logo={<NotificationLogo />} 
             notificationCount={unreadNotificationCount} 
           />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 border-gray-700 bg-black text-white" side="right">
            <div className="font-bold border-b border-gray-700 px-3 py-2">Notifications</div>
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))
                ) : (
                    <p className="text-center text-gray-400 p-4">No new notifications.</p>
                )}
            </div>
        </PopoverContent>
      </Popover>
    
    <div>
       <Link to="/messages">
    <SidebarComponent name="Messages" logo={<MessagesLogo />} 
    notificationCount={unreadMessageCount}/>
  </Link>
    </div>
     <div>
<Link to="/bookmarks">
    <SidebarComponent name="Bookmarks" logo={<BookMarkLogo />} />
  </Link>
     </div>
      
      <div>
<Link to={`/profile/${user.id}`}>
    <SidebarComponent name="Profile" logo={<ProfileLogo />} />
  </Link>

      </div>
  
      <div className="pt-2">
        <Link to="/homefeed?compose=1" className="block w-full">
          <div className="w-full text-center rounded-full bg-sky-500 hover:bg-sky-600 text-white py-2 font-semibold">Post</div>
        </Link>
      </div>
      
    </div>
  );
}
