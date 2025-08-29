import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Plus } from "lucide-react";

// Define a type for the user object
type User = {
  id: string;
  name: string;
  username: string;
  profilePic: string;
  description?: string;
};

interface UserCardProps {
  user: User;
  isFollowing: boolean;
  onFollowToggle: (userId: string) => void;
}

export const UserCard = ({ user, isFollowing, onFollowToggle }: UserCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.profilePic} alt={user.name} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isFollowing ? "default" : "outline"}
            onClick={() => onFollowToggle(user.id)}
          >
            {isFollowing ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </CardHeader>
      {user.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{user.description}</p>
        </CardContent>
      )}
    </Card>
  );
};