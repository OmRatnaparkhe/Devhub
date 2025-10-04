import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link,  useParams } from "react-router-dom";
import { Loader2, Github, ExternalLink, Rss, Code, BookOpen } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FollowUsers from "../onboarding/FollowUsers";
import { PostCard } from "@/components/PostCard";
import React from "react";

// --- TYPE DEFINITIONS ---
interface Technology { id: string; name: string; }
interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profilePic: string;
  };
  likes: { userId: string }[];
  comments: any[];
  bookmarks: { userId: string }[];
}
interface Project { id: string; title: string; description: string; thumbnail: string; githubUrl: string; liveUrl?: string; technologies: Technology[]; }
interface Blog { id: string; title: string; description: string; blogThumbnail: string; publishedAt: string; technologies: Technology[]; }
interface UserProfile { id: string; name: string; username: string; profilePic?: string; githubLink: string; description?: string; role: string; posts: Post[]; projects: Project[]; blogs: Blog[]; followers?: any[]; following?: any[]; }

// --- CARDS ---


const ProjectCard = React.memo(({ project }: { project: Project }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <img src={project.thumbnail || "https://placehold.co/600x400"} alt={project.title} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="font-bold text-lg">{project.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {project.technologies.map(tech => (
          <span key={tech.id} className="text-xs bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 px-2 py-1 rounded-full">
            {tech.name}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center space-x-4">
        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500">
          <Github size={20} />
        </a>
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500">
            <ExternalLink size={20} />
          </a>
        )}
      </div>
    </div>
  </div>
));

const BlogCard = React.memo(({ blog }: { blog: Blog }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <img loading="lazy" src={blog.blogThumbnail || "https://placehold.co/600x400"} alt={blog.title} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="font-bold text-lg">{blog.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{blog.description}</p>
      <p className="text-xs text-gray-400 mt-2">{new Date(blog.publishedAt).toLocaleDateString()}</p>
    </div>
  </div>
));

// --- MAIN PROFILE PAGE ---
export const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "blogs">("posts");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    username: "",
    description: "",
    githubLink: "",
    role: "",
    profilePic: ""
  });

  // Sync formData with profile once loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        username: profile.username || "",
        description: profile.description || "",
        githubLink: profile.githubLink || "",
        role: profile.role || "",
        profilePic: profile.profilePic || ""
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      const body = new FormData();

      body.append("name", formData.name);
      body.append("username", formData.username);
      body.append("description", formData.description);
      body.append("githubLink", formData.githubLink);
      body.append("role", formData.role);

      if (formData.profilePic instanceof File) {
        body.append("profilePic", formData.profilePic); // ✅ upload new file
      } else {
        body.append("profilePic", formData.profilePic || "");
      }

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/${profile?.id}/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      setFormData((prev: any) => ({
        ...prev,
        profilePic: updated.profilePic || prev.profilePic
      }));
      setEditOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const { data: queriedProfile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) return null;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/users/${userId}/profile?full=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      return data as UserProfile;
    },
    staleTime: 120_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev as any,
  });

  // Sync local state for edit form convenience
  useEffect(() => {
    if (queriedProfile) setProfile(queriedProfile);
  }, [queriedProfile]);
  
  
      // This useEffect handles ALL data fetching whenever 'page' changes
     

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-sky-500" /></div>;
  if (!profile) return <p className="text-center mt-20 text-red-500">Profile not found</p>;

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="flex justify-center pt-20 px-4">
      {/* LEFT SIDEBAR */}
      <div className="hidden lg:block w-[250px] pr-4">
        <Sidebar />
      </div>

      {/* CENTER CONTENT */}
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-black dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={profile.profilePic || "https://placehold.co/100x100"}
              alt={profile.name}
              loading="lazy"
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-500">@{profile.username}</p>
              <p className="text-sky-600">{profile.role}</p>
              <a className="text-gray-300" target="_blank" href={profile.githubLink}>This is my Github link</a>
              <p className="mt-2">{profile.description}</p>
              <div className="flex space-x-6 mt-2 text-sm">
                <Link className="hover:bg-gray-100 rounded-lg hover:text-black p-1" to="/profile/:userId/followers">
                  <p ><span className="font-bold">{profile.followers?.length ?? 0}</span> Following</p>
                </Link>

                <Link className="hover:bg-gray-100 rounded-lg hover:text-black p-1" to="/profile/:userId/followers">
                  <p ><span className="font-bold">{profile.following?.length ?? 0}</span> Followers</p>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            {isOwnProfile ? (
              <button
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 border border-sky-600 text-sky-600 rounded-full hover:bg-sky-50"
              >
                Edit Profile
              </button>
            ) : (
              <button className="px-4 py-2 bg-sky-500 text-white rounded-full hover:bg-sky-600">Follow</button>
            )}
          </div>

          {/* Edit Modal */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
                <Input name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
                <Input name="role" value={formData.role} onChange={handleChange} placeholder="Role" />
                <Input  name="githubLink" value={formData.githubLink} onChange={handleChange} placeholder="GitHub Link" />

                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, profilePic: file });
                      }
                    }}
                  />
                  {/* Preview */}
                  {formData.profilePic instanceof File ? (
                    <img
                      src={URL.createObjectURL(formData.profilePic)}
                      alt="Preview"
                      className="mt-2 w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    profile?.profilePic && (
                      <img
                        src={profile.profilePic}
                        alt="Current"
                        className="mt-2 w-20 h-20 rounded-full object-cover"
                      />
                    )
                  )}
                </div>

                <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex justify-center bg-black dark:bg-gray-800 rounded-lg shadow p-2 space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md ${activeTab === "posts" ? "bg-sky-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            <Rss size={16} /> <span>Posts</span>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md ${activeTab === "projects" ? "bg-sky-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            <Code size={16} /> <span>Projects</span>
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md ${activeTab === "blogs" ? "bg-sky-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            <BookOpen size={16} /> <span>Blogs</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          profile.posts.length > 0
            ? profile.posts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id ?? ""} />)
            : <p className="text-center text-gray-500">No posts yet.</p>
        )}
        {activeTab === "projects" && (
          <div className="grid md:grid-cols-2 gap-6">
            {profile.projects.length > 0
              ? profile.projects.map(p => <ProjectCard key={p.id} project={p} />)
              : <p className="text-center text-gray-500 col-span-2">No projects.</p>}
          </div>
        )}
        {activeTab === "blogs" && (
          <div className="grid md:grid-cols-2 gap-6">
            {profile.blogs.length > 0
              ? profile.blogs.map(b => <BlogCard key={b.id} blog={b} />)
              : <p className="text-center text-gray-500 col-span-2">No blogs.</p>}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="hidden lg:block w-[300px] pl-4">

        <Card>
          <div className="p-4 font-semibold">Who to follow</div>
          <FollowUsers context="widget" />
        </Card>
      </div>
    </div>
  );
};

export default Profile;
