// ProjectInputModal.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { backendUrl } from "@/config/api";

const ProjectInputModal = ({ isOpen, onClose, onSubmit }) => {
  // existing fields (unchanged)
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [status, setStatus] = useState('Draft');

  // NEW fields to match schema / route
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validation (matches backend guards)
    if (!projectTitle.trim() || !description.trim() || !githubUrl.trim() || !technologies.trim()) {
      alert("Title, Description, GitHub URL and Technologies are required!");
      return;
    }

    const token = await getToken();

    // Build FormData for multipart upload
    const formData = new FormData();
    formData.append("title", projectTitle);
    formData.append("description", description);
    formData.append("githubUrl", githubUrl);
    if (liveUrl) formData.append("liveUrl", liveUrl);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    // Ensure backend receives an array for `technologies`
    technologies
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .forEach(t => formData.append("technologies", t));

    try {
      const res = await fetch(`${backendUrl}api/projects/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        console.error(await res.text());
        alert("Failed to create project.");
        return;
      }

      // keep your original external API contract
      onSubmit?.({
        projectTitle,
        description,
        technologies: technologies.split(',').map(t => t.trim()).filter(Boolean),
        status,
        githubUrl,
        liveUrl,
      });

      // reset form
      setProjectTitle('');
      setDescription('');
      setTechnologies('');
      setStatus('Draft');
      setGithubUrl('');
      setLiveUrl('');
      setThumbnail(null);

      onClose();
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Something went wrong while creating the project.");
    }
  };

  if (!isOpen) return null;

  return (
    // overlay (unchanged)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* scrollable wrapper with hidden scrollbar (no plugin needed) */}
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* card (unchanged) */}
        <Card className="w-full mx-auto shadow-lg rounded-xl animate-fade-in-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Create New Project</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title (existing) */}
              <div>
                <Label htmlFor="projectTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Project Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectTitle"
                  type="text"
                  placeholder="e.g., E-commerce Dashboard"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* Description (existing) */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Description (Required)
                </Label>
                <Textarea
                  id="description"
                  placeholder="A brief overview of your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-y"
                  required
                />
              </div>

              {/* Technologies (existing) */}
              <div>
                <Label htmlFor="technologies" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Technologies (comma-separated) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="technologies"
                  type="text"
                  placeholder="e.g., React, Tailwind, Node.js"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate technologies with commas (e.g., React, TypeScript, Tailwind)
                </p>
              </div>

              {/* Status (existing, unchanged) */}
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* NEW: Thumbnail */}
              <div>
                <Label htmlFor="thumbnail" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Thumbnail (square works best)
                </Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be uploaded & resized to ~300×300 server-side.
                </p>
              </div>

              {/* NEW: GitHub URL */}
              <div>
                <Label htmlFor="githubUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  GitHub URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/you/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* NEW: Live URL */}
              <div>
                <Label htmlFor="liveUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Live URL (optional)
                </Label>
                <Input
                  id="liveUrl"
                  type="url"
                  placeholder="https://yourapp.live"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              {/* Actions (existing) */}
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
                  Create Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectInputModal;
