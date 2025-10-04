import { Sidebar } from "@/components/Sidebar";
import { UserListCard } from "@/components/UserListCard";
import { Input } from "@/components/ui/input";
import { useAuth, useUser } from "@clerk/clerk-react"; // Import useUser
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

// Define the User type, or import it from a shared types file
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
    
    // This state will now be correctly initialized
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

    const { getToken } = useAuth();
    const { user: currentUser } = useUser(); // Get the current user

    // ✅ EFFECT 1: Initialize the follow status for ALL potential users on mount
    useEffect(() => {
        const initializeFollowStatus = async () => {
            try {
                const token = await getToken();
                // Always fetch the list of users the current user is following
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/following`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const followingList: User[] = await response.json();

                // Create a map for quick lookup: { userId: true, anotherUserId: true }
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


    // ✅ EFFECT 2: Fetch the users to DISPLAY when the tab changes
    useEffect(() => {
        const fetchDisplayUsers = async () => {
            setLoading(true);
            const endpoint = activeTab === 'followers' ? 'followers' : 'following';
            try {
                const token = await getToken();
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/${endpoint}`, {
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
        // Optimistic UI update
        const isCurrentlyFollowing = !!followingStatus[userId];
        setFollowingStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));

        // If on the 'following' tab, optimistically remove/add the user from the list
        if (activeTab === 'following') {
            if (isCurrentlyFollowing) {
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } 
            // Note: adding back is complex, a refetch might be simpler, but this handles the main use case.
        }

        try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/${userId}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                // Revert UI on failure
                setFollowingStatus(prev => ({ ...prev, [userId]: isCurrentlyFollowing }));
            }
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
            // Revert UI on failure
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
                {/* --- Tabs and Search Input (No Changes) --- */}
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

                {/* --- Content Display (Minor change to hide own user card) --- */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
                                // Don't show the current user in the list
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