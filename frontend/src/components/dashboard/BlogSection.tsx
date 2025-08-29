import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MessageSquare, Trash2 } from "lucide-react";

const BlogSection = ({ blogs, handleBlogClick, handleDeleteBlog }) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Posts</CardTitle>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <CardDescription>Your latest blog articles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blogs.map((post, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-muted p-4 rounded-lg transition-colors relative group"
              onClick={() => handleBlogClick(post)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBlog(post);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <h3 className="font-medium text-sm leading-tight mb-1">
                {post.title}
              </h3>
              {post.coverImageUrl && (
                <img
                  src={post.coverImageUrl}
                  alt="Cover"
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <p className="text-xs text-muted-foreground mb-2">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {post.technologies?.map((tech, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{post.publishedAt}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogSection;
