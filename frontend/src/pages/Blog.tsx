import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Calendar, BookOpen, TrendingUp, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// --- TYPE DEFINITIONS ---
type DevToPost = {
  id: number;
  title: string;
  description: string;
  url: string;
  cover_image: string | null;
  tag_list: string[];
  user: {
    name: string;
    profile_image_90: string;
  };
  published_at: string;
};

const Blog = () => {
  const [posts, setPosts] = useState<DevToPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialTag = searchParams.get("tag") || "webdev";
  const initialFilter = searchParams.get("filter") || "new";

  const [page, setPage] = useState(initialPage);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState("");

  const PER_PAGE = 12;

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const filterParam = filter === 'trending' ? 'top=7' : '';
    const tagParam = `tag=${selectedTag}`;
     const currentTag = searchTerm.trim() ? searchTerm.trim().toLowerCase() : selectedTag;
    
    const paginationParams = `per_page=${PER_PAGE}&page=${page}`;
    
    const apiUrl = `https://dev.to/api/articles?${tagParam}&${paginationParams}&${filterParam}`;

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Failed to fetch blogs: ${res.statusText}`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error while fetching blogs:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTag, filter]);

  useEffect(() => {
    fetchBlogs();
    const params = new URLSearchParams();
    params.set("page", page.toString());
     params.set("tag", searchTerm.trim() ? searchTerm.trim().toLowerCase() : selectedTag);
    params.set("filter", filter);
    setSearchParams(params);
  }, [fetchBlogs, page, selectedTag, filter, setSearchParams,searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSelectedTag(searchTerm.trim().toLowerCase());
      setPage(1);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Developer Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover insights, tutorials, and thoughts from the developer community.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by tag (e.g., react, python)..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <div className="flex gap-2">
            <Button variant={filter === 'trending' ? 'default' : 'outline'} onClick={() => { setFilter('trending'); setPage(1); }}>
              <TrendingUp className="mr-2 h-4 w-4" /> Trending
            </Button>
            <Button variant={filter === 'new' ? 'default' : 'outline'} onClick={() => { setFilter('new'); setPage(1); }}>
              <Clock className="mr-2 h-4 w-4" /> Recent
            </Button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["webdev", "javascript", "react", "node", "css", "beginners"].map((tag) => (
            <Button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setSearchTerm(tag);
                setPage(1);
              }}
              variant={selectedTag === tag ? "default" : "outline"}
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Blog Section Title */}
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Dev.to Articles
        </h2>

        {/* Pinterest-style Masonry Layout */}
        {loading ? (
          <p>Loading articles...</p>
        ) : posts.length === 0 ? (
          <p>No articles found. Try a different filter.</p>
        ) : (
          <div className="sm:columns-2 lg:columns-3 gap-8 space-y-8">
            {posts.map((post) => (
              <div key={post.id} className="break-inside-avoid">
                <Card className="hover:shadow-lg transition-shadow border border-border/50">
                  {post.cover_image && (
                    <img src={post.cover_image} alt={post.title} className="rounded-t-md w-full object-cover" />
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg leading-tight hover:text-primary transition-colors cursor-pointer line-clamp-2">
                      <a href={post.url} target="_blank" rel="noopener noreferrer">{post.title}</a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.user.profile_image_90} />
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                        {post.user.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {post.tag_list.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-8 gap-4">
          <Button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} variant="outline">
            Previous
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">Page {page}</span>
          <Button onClick={() => setPage((p) => p + 1)} disabled={posts.length < PER_PAGE} variant="outline">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Blog;