import { useEffect, useState } from "react";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useInView } from "react-intersection-observer";
import { Sidebar } from "../../components/Sidebar"
import { Card } from "@/components/ui/card";
import FollowUsers from "../onboarding/FollowUsers";
export const Home = () => {
    const { getToken } = useAuth()
    const { user } = useUser();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // This useEffect handles ALL data fetching whenever 'page' changes
    useEffect(() => {
        // This guard is crucial. It prevents fetching page 1 twice on mount,
        // and stops if there are no more pages.
        if (!hasMore || (page === 1 && posts.length > 0)) return;

		const fetchPage = async () => {
			setLoading(true);
			try {
				const token = await getToken();
				const response = await fetch(`http://localhost:3000/api/posts/feed?page=${page}&limit=5`, {
					method: "GET",
					headers: {
						Authorization: token ? `Bearer ${token}` : "",
					},
				});

				if (!response.ok) {
					console.error("Failed to fetch feed: ", response.status, response.statusText);
					setHasMore(false);
					return;
				}

				const data = await response.json().catch(() => ({}));
				const postsArray = Array.isArray(data?.posts) ? data.posts : [];

				if (postsArray.length === 0) {
					setHasMore(false);
				} else {
					setPosts(prev => [...prev, ...postsArray]);
					const hasNext = data && Object.prototype.hasOwnProperty.call(data, "nextPage") ? data.nextPage !== null : postsArray.length > 0;
					setHasMore(hasNext);
				}
			} catch (error) {
				console.error("Failed to fetch feed:", error);
			} finally {
				setLoading(false);
			}
		};

        fetchPage();
    }, [page]); // The main trigger is the page number changing

    // The 'ref' from useInView is now primarily for its `onChange` callback
    const { ref } = useInView({
        threshold: 1.0,
        // The onChange callback is the key to the fix
        onChange: (isInView) => {
            // Fire only when the element IS in view and we are NOT loading/finished
            if (isInView && !loading && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        },
    });

    const handlePostCreated = (newPost: any) => {
        setPosts(prev => [newPost, ...prev]);
    };

    return (
  <div className="flex justify-center pt-20 px-4">
    {/* LEFT SIDEBAR */}
    <div className="hidden  lg:block w-[250px] pr-4 ">
      <div className="sticky top-20">
        <Sidebar />
      </div>
      
    </div>

    {/* CENTER FEED */}
    <div className="w-full max-w-2xl">
      {user && <CreatePost onPostCreated={handlePostCreated} />}
      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="flex justify-center items-center h-20">
          {loading && <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground my-8">You've reached the end! 🎉</p>
      )}

      {posts.length === 0 && !loading && (
        <p className="text-center text-muted-foreground my-8">
          Your feed is empty. Follow some users to see their posts!
        </p>
      )}
    </div>

    {/* RIGHT SIDEBAR */}
    <div className="hidden lg:block w-[300px] pl-4">
      <div className="sticky top-20">

        <Card>
        <div className="pt-4 pl-4 font-semibold">Who to follow</div>
        <FollowUsers context="widget" />
      </Card>
      </div>

      
    </div>
  </div>
);

};

export default Home;