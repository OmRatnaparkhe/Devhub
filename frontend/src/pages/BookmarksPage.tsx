import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Sidebar } from "@/components/Sidebar";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";

// You can reuse the Post type from PostCard.tsx
type Post = any; // Or import the full type

export const BookmarksPage = () => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const response = await fetch("http://localhost:3000/api/posts/bookmarks", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                setBookmarkedPosts(data);
            } catch (error) {
                console.error("Failed to fetch bookmarks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, [getToken]);

    return (
        <div className="flex justify-center pt-20 px-4">
            <div className="hidden lg:block w-[250px] pr-4">
                <Sidebar />
            </div>

            <div className="w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-4">Your Bookmarks</h1>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : bookmarkedPosts.length > 0 ? (
                    bookmarkedPosts.map(post => (
                        <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground my-8">
                        You haven't bookmarked any posts yet.
                    </p>
                )}
            </div>
             {/* Optional Right Sidebar */}
             <div className="hidden lg:block w-[300px] pl-4"></div>
        </div>
    );
};

export default BookmarksPage;