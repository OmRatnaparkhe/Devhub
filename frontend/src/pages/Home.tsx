import { useEffect, useState, useCallback } from "react";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useInView } from "react-intersection-observer"; // 1. Import the hook

export const Home = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Add state for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 3. Setup the Intersection Observer hook
  const { ref, inView } = useInView({
    threshold: 1.0, // Trigger when the element is 100% visible
  });

  const fetchFeed = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    try {
      // Pass the current page to the API
      const response = await fetch(`/api/posts/feed?page=${page}&limit=5`);
      const data = await response.json();
      
      // Append new posts instead of replacing them
      setPosts(prev => [...prev, ...data.posts]);
      setPage(prev => prev + 1);
      setHasMore(data.nextPage !== null);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore]);

  // Fetch initial data
  useEffect(() => {
    fetchFeed();
  }, []); // Runs only once on mount

  // 4. Trigger fetching more data when the sentinel div is in view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchFeed();
    }
  }, [inView, hasMore, loading, fetchFeed]);

  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [newPost, ...prev]);
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      {user && <CreatePost onPostCreated={handlePostCreated} />}
      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
        ))}
      </div>
      
      {/* 5. The trigger element and loading indicator */}
      {hasMore && (
        <div ref={ref} className="flex justify-center items-center h-20">
          {loading && <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground my-8">You've reached the end!</p>
      )}

      {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground my-8">Your feed is empty. Follow some users to see their posts!</p>
      )}
    </div>
  );
};

export default Home;