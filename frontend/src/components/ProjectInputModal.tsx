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

// ProjectInputModal component definition
const ProjectInputModal = ({ isOpen, onClose, onSubmit }) => {
  // State variables for form fields
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState(''); // Storing as comma-separated string
  const [status, setStatus] = useState('Draft'); // Default status

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    // Basic validation for project title
    if (!projectTitle.trim()) {
      alert("Project Title is required!"); // Using alert for simplicity, consider a custom modal for better UX
      return;
    }
    // Call the onSubmit prop with the form data
    onSubmit({
      projectTitle,
      description,
      technologies: technologies.split(',').map(tech => tech.trim()).filter(tech => tech), // Split technologies into an array
      status
    });
    // Clear form fields after submission
    setProjectTitle('');
    setDescription('');
    setTechnologies('');
    setStatus('Draft');
    onClose(); // Close the modal
  };

  // If the modal is not open, return null to render nothing
  if (!isOpen) return null;

  return (
    // Modal overlay for dimming the background
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal content card */}
      <Card className="w-full max-w-lg mx-auto shadow-lg rounded-xl animate-fade-in-up">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-center">Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Project input form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title Input */}
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
                required // HTML5 required attribute for basic validation
              />
            </div>

            {/* Description Textarea */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="A brief overview of your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-y"
              />
            </div>

            {/* Technologies Input */}
            <div>
              <Label htmlFor="technologies" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Technologies (comma-separated)
              </Label>
              <Input
                id="technologies"
                type="text"
                placeholder="e.g., React, Tailwind, Node.js"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate technologies with commas (e.g., React, TypeScript, Tailwind)</p>
            </div>

            {/* Status Select */}
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
                variant="default" // Using default variant, ensure it's styled as a primary button
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
              >
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInputModal;

