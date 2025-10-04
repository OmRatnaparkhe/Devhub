// File: FollowUsers.tsx

import { useEffect, useState, useMemo } from "react"; // Re-add useRef if a state solution is too complex
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/clerk-react";
import { UserListCard } from "@/components/UserListCard";

// Define User type
type User = {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
    description?: string;
    role?: string;
};

interface FollowUsersProps {
    context?: 'page' | 'widget';
}

export const FollowUsers = ({ context = 'page' }: FollowUsersProps) => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [allFetchedUsers, setAllFetchedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");

    // Track if a search operation is active to differentiate initial suggestions from search results.
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Effect to initialize follow status from the user's full following list
    useEffect(() => {
        const initializeFollowStatus = async () => {
            const token = await getToken();
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/following`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    console.error("Failed to fetch following list:", response.status, response.statusText);
                    return;
                }
                const json = await response.json().catch(() => []);
                const followingList: User[] = Array.isArray(json) ? json : [];
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

    // Function to fetch users based on search query and context limit
    const fetchUsersByQuery = async () => {
        setLoading(true);
        setIsSearchActive(searchTerm.length > 0); // Mark search as active if search term exists

        const limit = context === 'page' ? 10 : 5;
        try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/search?query=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
                headers: { Authorization: token ? `Bearer ${token}` : "" }
            });
            if (!response.ok) {
                console.error("Failed to fetch users:", response.status, response.statusText);
                setAllFetchedUsers([]);
                return;
            }
            const json = await response.json().catch(() => []);
            const data: User[] = Array.isArray(json) ? json : [];
            setAllFetchedUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setAllFetchedUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount
    useEffect(() => {
        fetchUsersByQuery();
    }, []); // Runs once on mount

    // Follow toggle logic
    const handleFollowToggle = async (userId: string) => {
        const isCurrentlyFollowing = !!followingStatus[userId];
        setFollowingStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
        try {
            const token = await getToken();
            await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/${userId}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
            setFollowingStatus(prev => ({ ...prev, [userId]: isCurrentlyFollowing }));
        }
    };

    // --- UPDATE: Final filtering logic ---
    const displayedUsers = useMemo(() => {
        const usersArray = Array.isArray(allFetchedUsers) ? allFetchedUsers : [];
        if (context === 'widget') {
            if (isSearchActive) {
                // Search Mode: show results directly
                return usersArray.slice(0, 3);
            } else {
                // Suggestion Mode: filter out users already followed
                return usersArray.filter(user => !followingStatus[user.id]).slice(0, 3);
            }
        }
        // For 'page' mode, just return all fetched users (search results).
        return usersArray;
    }, [allFetchedUsers, followingStatus, context, isSearchActive]);

    const handleSearchClick = () => {
        fetchUsersByQuery();
    };

    // Reset to suggestions when search bar is cleared manually
    useEffect(() => {
        if (searchTerm === "") {
            setIsSearchActive(false);
            // Optionally refetch initial suggestions when search is cleared
            // fetchUsersByQuery(); 
        }
    }, [searchTerm]);

    // --- Render logic ---
    if (context === 'widget') {
        return (
            <div className="p-2 space-y-3">
                <div className="flex gap-2 p-2">
                    <Input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            handleSearchClick()
                        }}

                        className="h-8 text-xs"
                    />

                </div>

                {loading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-2" />}
                {!loading && displayedUsers.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center p-2">No users found.</p>
                )}
                {displayedUsers.map(user => (
                    <UserListCard
                        key={user.id}
                        user={user}
                        isFollowing={!!followingStatus[user.id]} // Button state will be correct
                        onFollowToggle={handleFollowToggle}
                        size="compact"
                    />
                ))}
            </div>
        );
    }

    // Default return: Full page layout for onboarding/discovery
    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Find People to Follow</h1>
                    <p className="text-muted-foreground mt-2">
                        Follow developers to see their projects and posts in your feed.
                    </p>
                </div>
                <div>
                    <Button className="mt-2" onClick={() => navigate('/')}>Finish & Go to Home</Button>
                </div>
                </div>
               



                <div className="flex gap-2 mb-4 mt-4">
                    <Input
                        type="text"
                        placeholder="Search based on role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleSearchClick}>Search</Button>
                </div>
                {/* ... loading and user grid ... */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedUsers.map(user => (
                            <UserListCard
                                key={user.id}
                                user={user}
                                isFollowing={!!followingStatus[user.id]}
                                onFollowToggle={handleFollowToggle}
                                size="full"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowUsers;