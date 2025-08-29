import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, UploadCloud } from "lucide-react"; // Import UploadCloud icon
import { Dialog, DialogContent } from '@radix-ui/react-dialog';


interface BlogInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  blogToEdit?: {
    id: string;
    title: string;
    content: string;
    technologies: string[];
    coverImage?: string;
    publishedAt?: string;
  };
}

// BlogInputModal component definition
const BlogInputModal = ({ isOpen, onClose, onSubmit, blogToEdit }) => {
  // State variables for form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [technologies, setTechnologies] = useState([]); // Array to store tags
  const [currentTechInput, setCurrentTechInput] = useState(''); // For the current tag being typed
  const [coverImageFile, setCoverImageFile] = useState<File | { name: string } | null>(null); // State to store the File object
  const [coverImagePreview, setCoverImagePreview] = useState(''); // State to store the image preview URL

  useEffect(() => {
    if (blogToEdit) {
      setTitle(blogToEdit.title || '');
      setContent(blogToEdit.content || '');
      setTechnologies(blogToEdit.technologies || []);
      
      // Always set the cover image preview if it exists
      if (blogToEdit.coverImage) {
        setCoverImagePreview(blogToEdit.coverImage);
        // Don't clear the existing image when editing
        const fileName = blogToEdit.coverImage.split('/').pop(); // Extract filename from URL
        setCoverImageFile({ name: fileName || 'Current Image' });
      } else {
        setCoverImagePreview('');
        setCoverImageFile(null);
      }
    } else {
      // Reset form when not editing
      setTitle('');
      setContent('');
      setTechnologies([]);
      setCoverImagePreview('');
      setCoverImageFile(null);
    }
  }, [blogToEdit]);
  // Function to handle adding a new technology tag
  const handleAddTechnology = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.type === 'blur') {
      e.preventDefault(); // Prevent form submission on Enter
      const newTech = currentTechInput.trim();
      if (newTech && !technologies.includes(newTech)) {
        setTechnologies([...technologies, newTech]);
        setCurrentTechInput(''); // Clear input after adding
      } else if (newTech && technologies.includes(newTech)) {
        // Optionally, provide feedback that the tag already exists
        console.log("Technology already added!");
        setCurrentTechInput(''); // Clear input even if duplicate
      }
    }
  };

  // Function to handle removing a technology tag
  const handleRemoveTechnology = (techToRemove) => {
    setTechnologies(technologies.filter(tech => tech !== techToRemove));
  };

  // Function to handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file); // Store the file object
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImagePreview(reader.result); // Set the preview URL (Base64)
        } else {
          setCoverImagePreview('');
        }
      };
      reader.readAsDataURL(file); // Read file as Data URL (Base64)
    } else {
      setCoverImageFile(null);
      setCoverImagePreview('');
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Blog Title is required!");
      return;
    }
    if (!content.trim()) {
      alert("Blog Content is required!");
      return;
    }

    // Preserve the existing image URL if no new image is uploaded
    const imageToSubmit = coverImageFile ? coverImagePreview : blogToEdit?.coverImage || coverImagePreview;

    onSubmit({
      id: blogToEdit?.id,
      title,
      content,
      technologies,
      coverImage: imageToSubmit,
      publishedAt: blogToEdit?.publishedAt || new Date().toISOString().split('T')[0],
      views: blogToEdit?.views || 0,
      comments: blogToEdit?.comments || 0,
    });

    // Reset form
    setTitle('');
    setContent('');
    setTechnologies([]);
    setCurrentTechInput('');
    setCoverImageFile(null);
    setCoverImagePreview('');
    onClose();
  };

  // If the modal is not open, return null to render nothing
  if (!isOpen) return null;

  return (
    // Modal overlay for dimming the background
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ zIndex: 60 }}>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Modal content card */}
      <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-xl animate-fade-in-up max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <CardTitle className="text-2xl font-semibold text-center">Write New Blog Post</CardTitle>
        </CardHeader>
        <CardContent
          className="overflow-y-auto flex-grow px-6 pb-6"
          style={{
            msOverflowStyle: 'none', /* IE and Edge */
            scrollbarWidth: 'none'  /* Firefox */
          }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="hide-scrollbar">
            {/* Blog post input form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <Label htmlFor="blogTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="blogTitle"
                  type="text"
                  placeholder="e.g., Building Scalable React Applications"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* Content Textarea */}
              <div>
                <Label htmlFor="blogContent" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="blogContent"
                  placeholder="Start writing your amazing blog post here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-y"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can use Markdown for formatting (e.g., **bold**, *italic*, `code`).
                  For a rich text editor, you'd integrate a library like TipTap or Quill.
                </p>
              </div>

              {/* Technologies Used (Tags Input) */}
              <div>
                <Label htmlFor="technologies" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Technologies Used
                </Label>
                <Input
                  id="technologies"
                  type="text"
                  placeholder="Type a technology and press Enter or comma"
                  value={currentTechInput}
                  onChange={(e) => setCurrentTechInput(e.target.value)}
                  onKeyDown={handleAddTechnology}
                  onBlur={handleAddTechnology} // Add tag on blur as well
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                      {tech}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTechnology(tech)}
                        className="h-auto p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label htmlFor="coverImageUpload" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Cover Image (Optional)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="coverImageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden" // Hide the default file input
                  />
                  <Label
                    htmlFor="coverImageUpload"
                    className="flex-grow flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition duration-200 text-muted-foreground"
                  >
                    <UploadCloud className="h-6 w-6 mr-2" />
                    {coverImageFile ? 
    (typeof coverImageFile === 'object' && 'name' in coverImageFile ? 
      coverImageFile.name : 
      'Current Image') : 
    'Click to upload image'}
                  </Label>
                  {coverImagePreview && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <img
                        src={coverImagePreview}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCoverImageFile(null);
                          setCoverImagePreview('');
                          // Clear the file input value as well
                          const input = document.getElementById('coverImageUpload') as HTMLInputElement | null;
                          if (input) input.value = '';
                        }}
                        className="absolute top-1 right-1 h-auto p-0.5 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a cover image for your blog post (e.g., JPEG, PNG, GIF).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-5 py-2 rounded-md transition duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                >
                  Publish Blog
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
     </DialogContent>
    </Dialog>
  );
};

export default BlogInputModal;
