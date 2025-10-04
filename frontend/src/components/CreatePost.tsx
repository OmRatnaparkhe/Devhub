import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

const postSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty.")
    .max(280, "Post is too long."),
  image: z.instanceof(File).optional(),
});


type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostProps {
  onPostCreated: (newPost: any) => void;

}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // preview state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<PostFormValues>({ resolver: zodResolver(postSchema) });
  const { getToken } = useAuth();

  const onSubmit = async (data: PostFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.BACKEND_URL_PROD}api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create post.");

      const newPost = await response.json();
      onPostCreated(newPost);

      // reset form and preview
      form.reset({ content: "", image: undefined });
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex space-x-3">
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-3">
          <Textarea
            placeholder="What's happening?"
            className="resize-none border-none focus-visible:ring-0 text-lg"
            {...form.register("content")}
          />

          {/* Image Preview Section */}
          {previewUrl && (
            <div className="relative w-fit">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[300px] rounded-lg border object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  form.setValue("image", undefined);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Image Upload Button */}
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    form.setValue("image", file);
                    setPreviewUrl(URL.createObjectURL(file)); // set preview
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </div>

            {/* Post Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-sky-500 hover:bg-sky-600 text-white px-5"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
