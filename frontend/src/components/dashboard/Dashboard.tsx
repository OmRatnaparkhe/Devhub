import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Eye,
  Heart,
  MessageSquare,
  FolderOpen,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Trash2
} from "lucide-react";
import { useState } from "react";
import ProjectInputModal from "@/components/ProjectInputModal";
import BlogInputModal from "@/components/BlogInputModal";
import BlogPage from "@/components/BlogComponent"; // Import the new BlogPage component
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
import ProjectSection from "./ProjectSection";
import BlogSection from "./BlogSection";

// Define the BlogData type for blog posts
type BlogData = {
  title: string;
  excerpt: string;
  content: string;
  publishedAt?: string;
  views: number;
  comments: number;
  likes: number;
  technologies?: string[];
  coverImageUrl?: string;
};

const Dashboard = () => {
  const stats = [
    {
      title: "Total Projects",
      value: "12",
      change: "+2 this month",
      icon: <FolderOpen className="h-4 w-4" />
    },
    {
      title: "Blog Posts",
      value: "24",
      change: "+4 this month",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      title: "Profile Views",
      value: "1,234",
      change: "+12% from last month",
      icon: <Eye className="h-4 w-4" />
    },
    {
      title: "Followers",
      value: "456",
      change: "+8 this week",
      icon: <Users className="h-4 w-4" />
    }
  ];

  const initialProjects = [
    {
      name: "E-commerce Dashboard",
      description: "Modern React dashboard with analytics",
      tech: ["React", "TypeScript", "Tailwind"],
      views: 234,
      likes: 18,
      status: "Published"
    },
    {
      name: "Task Manager API",
      description: "RESTful API built with Node.js and Express",
      tech: ["Node.js", "Express", "MongoDB"],
      views: 156,
      likes: 12,
      status: "Draft"
    },
    {
      name: "Weather App",
      description: "Beautiful weather app with animations",
      tech: ["Vue.js", "CSS3", "OpenWeather API"],
      views: 89,
      likes: 6,
      status: "Published"
    }
  ];

  const [projects, setProjects] = useState(initialProjects);

  const handleProjectSubmit = (newProjectData) => {
    setProjects((prev) => [
      {
        name: newProjectData.projectTitle,
        description: newProjectData.description,
        tech: newProjectData.technologies,
        views: 0,
        likes: 0,
        status: newProjectData.status
      },
      ...prev
    ]);
  };

  // Added a full content field for the blog posts
  const initialPosts = [
    {
      title: "Building Scalable React Applications",
      excerpt: "Learn the best practices for creating maintainable React apps...",
      content: "Building scalable React applications is about more than just writing code; it's about architecture, state management, and performance optimization. We'll explore topics like lazy loading components, using a robust state management library like Redux or Zustand, and structuring your project to handle growth gracefully. By focusing on these key areas, you can ensure your application remains fast and manageable as it grows.",
      publishedAt: "2 days ago",
      views: 456,
      comments: 12,
      likes: 25,
      technologies: ["React", "Scalability", "Best Practices"],
      coverImageUrl: "https://placehold.co/150x100/aabbcc/ffffff?text=React"
    },
    {
      title: "Understanding TypeScript Generics",
      excerpt: "A deep dive into TypeScript's powerful generic system...",
      content: "TypeScript's generics are a powerful tool for building reusable components. They allow you to create components that work with a variety of data types without sacrificing type safety. In this post, we'll walk through several examples, from simple functions to complex class-based components, to help you master this essential feature of TypeScript.",
      publishedAt: "1 week ago",
      views: 678,
      comments: 8,
      likes: 42,
      technologies: ["TypeScript", "Generics"],
      coverImageUrl: "https://placehold.co/150x100/ccddff/ffffff?text=TypeScript"
    },
    {
      title: "CSS Grid vs Flexbox: When to Use What",
      excerpt: "Comprehensive guide to modern CSS layout techniques...",
      content: "Choosing between CSS Grid and Flexbox can be confusing. While both are excellent tools for modern layout, they are designed for different purposes. Flexbox is ideal for one-dimensional layouts (a row or a column), while Grid is perfect for two-dimensional layouts. We'll break down the core differences with practical examples to help you decide which one to use for your next project.",
      publishedAt: "2 weeks ago",
      views: 892,
      comments: 15,
      likes: 60,
      technologies: ["CSS", "Grid", "Flexbox"],
      coverImageUrl: "https://placehold.co/150x100/ffccaa/ffffff?text=CSS"
    }
  ];

  const [blogs, setBlogs] = useState(initialPosts);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('projects');
  // New state to hold the currently selected blog post
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const uniqueTechnologies = Array.from(
    new Set(blogs.flatMap(blog => blog.technologies || []))
  )
  const handleBlogSubmit = (newBlogData) => {
    if (selectedBlog) {
      // Logic to update an existing blog
      setBlogs((prev) =>
        prev.map((blog) =>
          blog === selectedBlog
            ? {
              ...blog,
              title: newBlogData.title,
              excerpt: newBlogData.content.substring(0, 150) + '...',
              content: newBlogData.content,
              technologies: newBlogData.technologies,
              coverImageUrl: newBlogData.coverImage,
            }
            : blog
        )
      );
      setSelectedBlog(null); // Clear selected blog after update
    } else {
      // Logic to add a new blog (existing code)
      setBlogs((prev) => [
        {
          title: newBlogData.title,
          excerpt: newBlogData.content.substring(0, 150) + '...',
          content: newBlogData.content,
          publishedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          views: 0,
          comments: 0,
          likes: 0,
          technologies: newBlogData.technologies,
          coverImageUrl: newBlogData.coverImage,
        },
        ...prev,
      ]);
    }
  };

  // Function to open a blog in full screen
  const handleBlogClick = (blog: BlogData) => {
    console.log("Selected blog:", blog);
    setSelectedBlog(blog);
  };

  // Function to close the blog page and return to the dashboard
  const handleCloseBlog = () => {
    setSelectedBlog(null);
  };

  const handleEdit = (blog) => {
    setSelectedBlog(blog);
    setIsBlogModalOpen(true);
  };

  // Add this function to handle blog deletion
  const handleDeleteBlog = (blog) => {
    setBlogToDelete(blog);
    setShowDeleteDialog(true);
  };

  // Add this function to confirm deletion
  const confirmDelete = () => {
    setBlogs((prev) => prev.filter((blog) => blog !== blogToDelete));
    setShowDeleteDialog(false);
    setBlogToDelete(null);
    if (selectedBlog === blogToDelete) {
      setSelectedBlog(null);
    }
  };

  // If a blog is selected, render the BlogPage component

  const filteredBlogs = selectedTech ? blogs.filter(blog => blog.technologies?.includes(selectedTech)):blogs;
  // Otherwise, render the main dashboard
  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your developer profile.
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="hero" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className="text-muted-foreground">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="flex space-x-2 mb-4">
              <Button
                variant={activeView === 'projects' ? 'default' : 'outline'}
                onClick={() => setActiveView('projects')}
                className="flex-1"
              >
                My Projects
              </Button>
              <Button
                variant={activeView === 'blogs' ? 'default' : 'outline'}
                onClick={() => setActiveView('blogs')}
                className="flex-1"
              >
                My Blogs
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setSelectedTech(null)}
                className={`px-3 py-1 rounded-full border ${selectedTech === null ? 'bg-white text-black' : 'bg-black text-white'}`}>
                All
              </button>
              {uniqueTechnologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3 py-1 rounded-full border ${selectedTech === tech ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>{tech}</button>
              ))}
            </div>
            {/* Conditional Rendering based on activeView state */}
            {activeView === 'projects' ? (
              // Projects View
              <ProjectSection projects={projects} />
            ) : (
              // Blogs View
              <BlogSection
                blogs={filteredBlogs}
                handleBlogClick={handleBlogClick}
                handleDeleteBlog={handleDeleteBlog}
              />
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setIsProjectModalOpen(true)} className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                <Button onClick={() => setIsBlogModalOpen(true)} className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Write Blog Post
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectInputModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectSubmit}
      />
      <BlogInputModal
        isOpen={isBlogModalOpen}
        onClose={() => {
          setIsBlogModalOpen(false)
          setSelectedBlog(null)
        }}
        onSubmit={handleBlogSubmit}
        blogToEdit={selectedBlog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blog post
              "{blogToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectedBlog && !isBlogModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-background z-50 overflow-y-auto">
          <BlogPage
            blog={selectedBlog}
            allBlogs={blogs}
            onClose={handleCloseBlog}
            onEdit={handleEdit}
            onDelete={handleDeleteBlog}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
