import { ReactNode } from "react"

interface SidebarComponentprops{
    name : string,
    logo : ReactNode,
    notificationCount?:number;
}


export function SidebarComponent({name,logo,notificationCount}:SidebarComponentprops){
    return <div>
        <div className="flex gap-2 py-2 px-2 hover:bg-accent rounded-lg">
            <div>
                {logo}
            </div>
            <div>
                {name}
            </div>
            {notificationCount && notificationCount > 1 && (
                <div className="ml-auto flex items-center justify-center h-5 min-w-[20px] rounded-full bg-sky-500 px-1.5 text-xs text-white">
                    {notificationCount}
                </div>
            )}
        </div>
    </div>
}