import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Plus } from "lucide-react";

// Define a User type to use in our components
type User = {
    id: string;
    name: string;
    username: string;
    profilePic?: string;
    role?: string;
};

interface UserListCardProps {
    user: User;
    isFollowing: boolean;
    onFollowToggle: (userId: string) => void;
    size?: 'full' | 'compact';
}

export const UserListCard = ({ user, isFollowing, onFollowToggle, size = 'full' }: UserListCardProps) => {
    // Determine if we are in compact mode
    const isCompact = size === 'compact';

    return (
        // --- UPDATE ---: Reduce padding in compact mode
        <div className={`flex items-center justify-between border rounded-lg bg-card text-card-foreground ${isCompact ? 'p-2' : 'p-4'}`}>
            <Link to={`/profile/${user.id}`} className="flex items-center gap-3 overflow-hidden"> {/* Add overflow-hidden */}
                <img
                    src={user.profilePic || "https://placehold.co/100x100"}
                    alt={user.name}
                    // --- UPDATE ---: Smaller image for compact mode
                    className={`rounded-full object-cover flex-shrink-0 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}
                />
                <div className="overflow-hidden"> {/* Add overflow-hidden to allow text truncation */}
                    {/* --- UPDATE ---: Smaller text for compact mode */}
                    <h3 className={`font-bold truncate ${isCompact ? 'text-sm' : 'text-base'}`}>{user.name}</h3>
                    <p className={`text-sm text-muted-foreground truncate ${isCompact ? 'text-xs' : ''}`}>@{user.username}</p>
                    
                    {/* --- UPDATE ---: Hide role in compact mode to save space */}
                    {!isCompact && (
                        <p className="text-xs text-sky-500 mt-1">{user.role}</p>
                    )}
                </div>
            </Link>
            <Button
                // --- UPDATE ---: Use a slightly smaller button in compact mode if needed, ensure it doesn't wrap text.
                size="sm"
                variant={isFollowing ? "default" : "outline"}
                onClick={() => onFollowToggle(user.id)}
                className="ml-2 flex-shrink-0" // Add margin and prevent shrinking
            >
                {/* Keep icon and text for clarity, but ensure parent container handles space constraints */}
                {isFollowing ? (
                    <Check className="mr-1 h-4 w-4" /> // Slightly reduce margin for compact layout
                ) : (
                    <Plus className="mr-1 h-4 w-4" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
            </Button>
        </div>
    );
};