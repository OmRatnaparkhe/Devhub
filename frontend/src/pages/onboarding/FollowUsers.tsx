import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCard } from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define the same User type here or import from a shared types file
type User = {
  id: string;
  name: string;
  username: string;
  profilePic: string;
  description?: string;
};

export const FollowUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/search?query=');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFollowToggle = async (userId: string) => {
    // Optimistic UI update
    setFollowingStatus(prev => ({ ...prev, [userId]: !prev[userId] }));

    try {
      const response = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      if (!response.ok) {
        // Revert UI on failure
        setFollowingStatus(prev => ({ ...prev, [userId]: !prev[userId] }));
      }
    } catch (error) {
      console.error("Failed to toggle follow status:", error);
      // Revert UI on failure
      setFollowingStatus(prev => ({ ...prev, [userId]: !prev[userId] }));
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Find People to Follow</h1>
            <p className="text-muted-foreground mt-1">
              Follow developers to see their projects and posts in your feed.
            </p>
          </div>
          <Button onClick={() => navigate('/')}>Finish & Go to Home</Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                isFollowing={!!followingStatus[user.id]}
                onFollowToggle={handleFollowToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUsers;