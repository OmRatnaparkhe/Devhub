// src/components/BlogManager.jsx
import  { useState  } from 'react';
import BlogPage from './BlogComponent';
import BlogInputModal from './BlogInputModal';
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

// Sample data to start with
const initialBlogs = [
  {
    id: '1',
    title: 'Getting Started with React Hooks',
    excerpt: 'An in-depth guide to understanding and using React Hooks for state management and side effects.',
    content: 'React Hooks have revolutionized how we write functional components. In this post, we’ll dive into useState, useEffect, and more to show you how to build robust applications.',
    technologies: ['React', 'JavaScript', 'Hooks'],
    publishedAt: '2023-01-15',
    views: 1245,
    comments: 32,
    likes: 89,
    coverImageUrl: 'https://images.unsplash.com/photo-1633356122544-cd5e105d68e5?q=80&w=2940&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'The Power of Tailwind CSS',
    excerpt: 'Explore how this utility-first CSS framework can drastically speed up your development workflow.',
    content: 'Tailwind CSS is more than just a styling library; it’s a new way of thinking about building user interfaces. We’ll show you how to leverage its power to build beautiful and responsive designs quickly.',
    technologies: ['Tailwind CSS', 'CSS', 'Design'],
    publishedAt: '2023-02-20',
    views: 876,
    comments: 15,
    likes: 54,
    coverImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9408?q=80&w=2940&auto=format&fit=crop'
  }
];

const BlogManager = () => {
  // Update these state declarations at the top of your component
  const [blogs, setBlogs] = useState(initialBlogs);
  const [selectedBlog, setSelectedBlog] = useState(null); // Change this to null initially
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blogToEdit, setBlogToEdit] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  // This function is passed to BlogPage
  const handleEditBlog = (blog) => {
    setBlogToEdit(blog);
    setIsModalOpen(true);
  };

  // This function is passed to BlogInputModal
  const handleUpdateBlog = (updatedBlog) => {
    setBlogs(blogs.map(blog =>
      blog.id === updatedBlog.id ? { ...blog, ...updatedBlog } : blog
    ));
    setSelectedBlog({ ...selectedBlog, ...updatedBlog }); // Also update the currently viewed blog
    setIsModalOpen(false); // Close the modal
    setBlogToEdit(null); // Clear the blog being edited
  };

  // This function is passed to BlogPage to return to the dashboard view
  const handleCloseBlogPage = () => {
    setSelectedBlog(null);
  };

  // Update the delete handlers
  const handleDeleteClick = (blog) => {
    setBlogToDelete(blog);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (blogToDelete) {
      // Update blogs list and reset states immediately
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== blogToDelete.id));
      setSelectedBlog(null);
      setBlogToEdit(null);
      setShowDeleteDialog(false);
      setBlogToDelete(null);
    }
  };

  if (selectedBlog) {
    return (
      <>
        <BlogPage
          blog={selectedBlog}
          allBlogs={blogs}
          onClose={handleCloseBlogPage}
          onEdit={handleEditBlog}
          onDelete={handleDeleteClick}
        />
        <BlogInputModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleUpdateBlog}
          blogToEdit={blogToEdit}
        />
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="z-[60] fixed top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%]">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your blog post
                "{blogToDelete?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setBlogToDelete(null);
              }}>
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
      </>
    );
  }

  // Update the dashboard view's delete button
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Select a blog to view</h2>
      {blogs.map(blog => (
        <div key={blog.id} className="relative">
          <button 
            onClick={() => setSelectedBlog(blog)} 
            className="block w-full p-4 mb-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {blog.title}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(blog);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default BlogManager;