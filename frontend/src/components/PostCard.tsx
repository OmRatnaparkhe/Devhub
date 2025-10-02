import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

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
  bookmarks: { userId: string }[];
};

interface PostCardProps {
  post: Post;
  currentUserId: string;
}

export const PostCard = React.memo(( { post, currentUserId }: PostCardProps) => {
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(
    post.bookmarks?.some(b => b.userId === currentUserId)
  );
  const { getToken } = useAuth();

  const isLiked = likes?.some(like => like.userId === currentUserId);

  const handleLike = async () => {
    const originalLikes = [...likes];
    if (isLiked) {
      setLikes(prev => prev.filter(l => l.userId !== currentUserId));
    } else {
      setLikes(prev => [...prev, { userId: currentUserId }]);
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to like post");
    } catch (err) {
      console.error(err);
      setLikes(originalLikes);
    }
  };

  const handleBookmarkToggle = async () => {
    setIsBookmarked(prev => !prev);
    try {
      const token = await getToken();
      await fetch(`http://localhost:3000/api/posts/${post.id}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to bookmark", err);
      setIsBookmarked(prev => !prev);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error("Failed to comment");

      const saved = await response.json();
      setComments(prev => [...prev, saved]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Failed to comment. Try again.");
    }
  };

  return (
    <Card className="mb-6 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Header */}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Link to={`/profile/${post?.author?.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post?.author?.profilePic} />
                <AvatarFallback>{post?.author?.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <Link
                to={`/profile/${post?.author?.id}`}
                className="font-semibold hover:underline"
              >
                {post?.author?.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                @{post?.author?.username} ·{" "}
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleBookmarkToggle}>
            <Bookmark
              className={`h-5 w-5 ${
                isBookmarked ? "fill-current text-primary" : ""
              }`}
            />
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-4 pb-3">
        {post.content && (
          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {post.content}
          </p>
        )}
        {post.imageUrl && (
          <div className="mt-4 w-full flex justify-center">
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full max-h-[400px] object-contain rounded-lg border bg-black/5"
            />
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-2 flex flex-col items-start gap-3 border-t">
        {/* Actions */}
        <div className="flex items-center gap-6 text-muted-foreground">
          <button
            className="flex items-center gap-1 hover:text-red-500 transition"
            onClick={handleLike}
          >
            <Heart
              className={`h-5 w-5 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            <span className="text-sm">{likes?.length}</span>
          </button>

          <div className="flex items-center gap-1">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{comments?.length}</span>
          </div>
        </div>

        {/* Comment Box */}
        <form onSubmit={handleCommentSubmit} className="w-full flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="text-sm"
          />
          <Button type="submit" size="sm">
            Reply
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
});
