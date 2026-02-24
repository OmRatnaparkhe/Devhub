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
import { backendUrl } from "@/config/api";

export const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { getToken } = useAuth()
    const { user } = useUser();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    

    
    useEffect(() => {
        if (!hasMore || (page === 1 && posts.length > 0)) return;

		const fetchPage = async () => {
			setLoading(true);
			try {
				const token = await getToken();
				const response = await fetch(`${backendUrl}api/posts/feed?page=${page}&limit=5`, {
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
    }, [page]); 

    
    const { ref } = useInView({
        threshold: 1.0,
        onChange: (isInView) => {
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
      <div className="flex flex-col lg:flex-row justify-center pt-20 lg:pt-20 px-3 pb-20">
        <div className="hidden lg:block lg:w-[250px] lg:pr-2 lg:mb-0">
          <div className="lg:sticky lg:ml-12 lg:top-20">
            <Sidebar />
          </div>
        </div>

        
        <div className="w-full max-w-screen-sm sm:max-w-2xl mx-auto flex flex-col justify-center h-full px-3 sm:px-0">
          {user && (
            <CreatePost onPostCreated={handlePostCreated} autoFocus={shouldCompose} />
          )}
          <div className="lg:hidden ">
            <Card className="mt-0">
              <div className="pt-3  pl-3 text-sm sm:text-base font-semibold">Suggested for you</div>
              <FollowUsers context="widget" />
            </Card>
          </div>
          <div className="flex flex-col mt-4 lg:mt-0">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
            ))}
          </div>
          {hasMore && (
            <div ref={ref} className="flex justify-center items-center h-20">
              {loading && <Loader2 className="h-8 w-8 animate-spin" />}
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-muted-foreground my-8">
              You've reached the end! 🎉
            </p>
          )}
          {posts.length === 0 && !loading && (
            <p className="text-center text-muted-foreground my-8">
              Your feed is empty. Follow some users to see their posts!
            </p>
          )}
        </div>

        <div className="hidden lg:block lg:w-[300px] lg:mr-6  lg:mt-0">
          <div className="lg:sticky lg:top-20">
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