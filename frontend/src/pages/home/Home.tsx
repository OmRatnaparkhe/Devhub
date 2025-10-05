import { useEffect, useState } from "react";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useInView } from "react-intersection-observer";
import { Sidebar } from "../../components/Sidebar"
import { Card } from "@/components/ui/card";
import FollowUsers from "../onboarding/FollowUsers";
import { Link, useLocation, useNavigate } from "react-router-dom";
export const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
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
				const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/posts/feed?page=${page}&limit=5`, {
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

    const urlParams = new URLSearchParams(location.search);
    const shouldCompose = urlParams.get("compose") === "1";

    return (
  <div className="flex flex-col lg:flex-row justify-center pt-20 px-4 pb-20">
    {/* LEFT SIDEBAR (desktop) */}
    <div className="hidden lg:block lg:w-[250px] lg:pr-4 lg:mb-0">
      <div className="lg:sticky lg:top-20">
        <Sidebar />
      </div>
      
    </div>

    {/* CENTER FEED */}
    <div className="w-full max-w-2xl mx-auto lg:mx-0">
      {user && <CreatePost onPostCreated={handlePostCreated} autoFocus={shouldCompose} />}
      {/* SUGGESTED USERS (mobile-only) */}
      <div className="lg:hidden">
        <Card className="mt-4">
          <div className="pt-4 pl-4 font-semibold">Suggested for you</div>
          <FollowUsers context="widget" />
        </Card>
      </div>
      <div className="mt-4">
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

    {/* RIGHT SIDEBAR (desktop suggestions) */}
    <div className="hidden lg:block lg:w-[300px] lg:pl-4 lg:mt-0">
      <div className="lg:sticky lg:top-20">

        <Card>
        <div className="pt-4 pl-4 font-semibold">Who to follow</div>
        <FollowUsers context="widget" />
      </Card>
      </div>

      
    </div>
    {/* Bottom nav moved to global App */}
  </div>
);

};

export default Home;