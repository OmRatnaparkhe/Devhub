import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  Calendar,
  Eye,
  MessageSquare,
  Heart,
  Clock,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { useEffect, useState } from "react";
import  { useSearchParams } from "react-router-dom"
type DevToPost = {
  id: number;
  title: string;
  description: string;
  published_at: string;
  readable_publish_date: string;
  url: string;
  cover_image: string;
  tags: string;
  user: {
    name: string;
    profile_image: string;
  };
};

const Blog = () => {
  const [mediumPosts, setMediumPosts] = useState<DevToPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams,setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page")||"1",10);
  const [page, setPage] = useState(initialPage);
  const initialTag = searchParams.get("tag") || "webdev";
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const PER_PAGE = 6;
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://dev.to/api/articles?tag=${selectedTag}&per_page=${PER_PAGE}&page=${page}`
        )
        const data = await res.json();
        setMediumPosts(data);
      }
      catch (err) {
        console.error("Error while fetching the blogs", err);
      }
      finally {
        setLoading(false);
      }
    }

    fetchBlogs();

    const params = new URLSearchParams(window.location.search);
    params.set("page",page.toString());
    params.set("tag",selectedTag);
    const newUrl = `${window.location.search}?${params.toString()}`;
    window.history.replaceState({},"",newUrl);
    setSearchParams(params);
  }, [page, selectedTag])

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Developer Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover insights, tutorials, and thoughts from our community of developers.
            Learn something new every day.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search articles..." className="pl-10" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {["webdev", "javascript", "react", "node", "career","devops","datascience","machinelearning"].map((tag) => (
            <Button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setPage(1); // Reset to page 1 on tag change
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
          Medium Articles
        </h2>

        {/* Medium Blog Cards */}
        {loading ? (
          <p>Loading articles...</p>
        ) : mediumPosts.length === 0 ? (
          <p>No articles found</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {mediumPosts.map((post) => (
              <Card
                key={post.id}
                className="flex flex-col h-full hover:shadow-lg transition-transform hover:scale-[1.02] border border-border/50"
              >
                {post.cover_image && (
                  <img src={post.cover_image} alt={post.title} className="rounded-t-md w-full h-48 object-cover" />
                )}
                <CardHeader className="flex-1">
                  <CardTitle className="text-lg leading-tight hover:text-primary transition-colors cursor-pointer line-clamp-2">
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                      {post.title}
                    </a>
                  </CardTitle>
                  <CardDescription>
                    <p className="line-clamp-3 text-muted-foreground text-sm">{post.description}</p>
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.user.profile_image} />
                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                      </Avatar>
                      {post.user.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.split(",").map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" asChild className="w-full mt-2">
                    <a href={post.url} target="_blank" rel="noopener noreferrer">Read on Dev.to</a>
                  </Button>
                </CardContent>
              </Card>

            ))}
          </div>
        )}
        <div className="flex justify-center mt-8 gap-4">
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">Page {page}</span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>

      </div>
    </div>
  )
};




export default Blog;