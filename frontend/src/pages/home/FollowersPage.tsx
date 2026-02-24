import { Sidebar } from "@/components/Sidebar";
import { UserListCard } from "@/components/UserListCard";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { backendUrl } from "@/config/api";


type User = {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
    role: string;
};

export function ConnectionsPage() {
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
   
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

    const { getToken } = useAuth();
    const { user: currentUser } = useUser(); 

    
    useEffect(() => {
        const initializeFollowStatus = async () => {
            try {
                const token = await getToken();
                
                const response = await fetch(`${backendUrl}api/users/following`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const followingList: User[] = await response.json();

                
                const followingStatusMap = followingList.reduce((acc, user) => {
                    acc[user.id] = true;
                    return acc;
                }, {} as Record<string, boolean>);

                setFollowingStatus(followingStatusMap);
            } catch (err) {
                console.error("Failed to initialize follow status:", err);
            }
        };

        initializeFollowStatus();
    }, [getToken]);


    
    useEffect(() => {
        const fetchDisplayUsers = async () => {
            setLoading(true);
            const endpoint = activeTab === 'followers' ? 'followers' : 'following';
            try {
                const token = await getToken();
                const response = await fetch(`${backendUrl}api/users/${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error("Error while fetching users", err);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDisplayUsers();
    }, [activeTab, getToken]);


    const handleFollowToggle = async (userId: string) => {
        
        const isCurrentlyFollowing = !!followingStatus[userId];
        setFollowingStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));

        
        if (activeTab === 'following') {
            if (isCurrentlyFollowing) {
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } 
            
        }

        try {
            const token = await getToken();
            const response = await fetch(`${backendUrl}api/users/${userId}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                
                setFollowingStatus(prev => ({ ...prev, [userId]: isCurrentlyFollowing }));
            }
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
            setFollowingStatus(prev => ({ ...prev, [userId]: isCurrentlyFollowing }));
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <div className="flex justify-center pt-20 px-4">
            <div className="hidden lg:block w-[250px] pr-4">
                <Sidebar />
            </div>
            <main className="w-full max-w-2xl">
                <div className="flex border-b mb-4">
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`py-3 px-6 text-lg font-semibold ${activeTab === 'followers' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-muted-foreground'}`}
                    >
                        Followers
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`py-3 px-6 text-lg font-semibold ${activeTab === 'following' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-muted-foreground'}`}
                    >
                        Following
                    </button>
                </div>
                <div className="mb-6">
                    <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
                                if (user.id === currentUser?.id) return null;
                                
                                return (
                                    <UserListCard 
                                        key={user.id} 
                                        user={user} 
                                        isFollowing={!!followingStatus[user.id]}
                                        onFollowToggle={handleFollowToggle}
                                    />
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground mt-10">
                                {searchTerm
                                    ? "No users found."
                                    : `You don't have any ${activeTab} yet.`}
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ConnectionsPage;