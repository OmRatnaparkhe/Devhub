import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus } from "lucide-react";

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(280, "Post is too long."),
  image: z.instanceof(File).optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostProps {
  onPostCreated: (newPost: any) => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<PostFormValues>({ resolver: zodResolver(postSchema) });

  const onSubmit = async (data: PostFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create post.");

      const newPost = await response.json();
      onPostCreated(newPost); // Callback to update the feed
      form.reset({ content: "", image: undefined });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            className="resize-none border-none focus-visible:ring-0"
            {...form.register("content")}
          />
          <div className="flex justify-between items-center">
            <Button type="button" variant="ghost" size="icon" disabled>
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};