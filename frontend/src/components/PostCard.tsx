import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle } from "lucide-react";

// Assuming a Post type that matches your backend response
type Post = {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profilePic: string;
  };
  likes: { userId: string }[];
  comments: any[];
};

interface PostCardProps {
  post: Post;
  // You would get the current user's ID from Clerk's useUser hook
  currentUserId: string;
}

export const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");

  const isLiked = likes.some(like => like.userId === currentUserId);

  const handleLike = async () => {
    // Optimistic update
    setLikes(prev => 
      isLiked 
        ? prev.filter(like => like.userId !== currentUserId) 
        : [...prev, { userId: currentUserId }]
    );

    await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const response = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    const savedComment = await response.json();
    setComments(prev => [...prev, savedComment]);
    setNewComment("");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author.id}`}>
            <Avatar>
              <AvatarImage src={post.author.profilePic} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/profile/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>
            <p className="text-sm text-muted-foreground">@{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post content" className="mt-4 rounded-lg border" />
        )}
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start gap-4">
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <span>{likes.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-5 w-5" />
            <span>{comments.length}</span>
          </div>
        </div>
        <form onSubmit={handleCommentSubmit} className="w-full flex gap-2">
          <Input 
            placeholder="Add a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit" size="sm">Reply</Button>
        </form>
      </CardFooter>
    </Card>
  );
};