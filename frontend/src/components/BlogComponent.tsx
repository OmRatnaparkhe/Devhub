import  { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, MessageSquare, Heart,  Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Renders a full blog post and related posts.
 * @param {object} props - The component props.
 * @param {object} props.blog - The full blog post object to display.
 * @param {Array} props.allBlogs - The array of all blog posts for finding related content.
 * @param {function} props.onClose - The function to call to close the blog page.
 */
const BlogPage = ({ blog, allBlogs, onClose, onEdit, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!blog) {
    return <div className="text-center text-muted-foreground p-8">Blog not found.</div>;
  }

  // Filter for related posts based on shared technologies
  const relatedBlogs = allBlogs.filter(p =>
    p.title !== blog.title && // Exclude the current blog
    p.technologies.some(tech => blog.technologies.includes(tech)) // Check for matching technologies
  ).slice(0, 3); // Limit to 3 related posts

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(blog);
    setShowDeleteDialog(false);
  };

  return (
    <div className="bg-background min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={onClose} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button variant="outline" onClick={() => onEdit(blog)}>
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        {/* Main Blog Post Card */}
        <Card className="shadow-card mb-8">
          {blog.coverImageUrl && (
            <img
              src={blog.coverImageUrl}
              alt="Blog cover"
              className="w-full h-96 object-cover rounded-t-lg"
            />
          )}
          <CardHeader>
            <CardTitle className="text-4xl font-bold">
              {blog.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>{blog.publishedAt}</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.views}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {blog.comments}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {blog.likes}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {blog.technologies && blog.technologies.map((tech, techIndex) => (
                <Badge key={techIndex} variant="default" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-xl leading-relaxed">{blog.excerpt}</p>
            <br />
            <p>{blog.content}</p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Related Posts Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
          {relatedBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((post, index) => (
                <Card key={index} className="shadow-card cursor-pointer hover:bg-muted transition-colors">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg leading-tight mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.technologies && post.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No related posts found.</p>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blog post
              "{blog.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogPage;
