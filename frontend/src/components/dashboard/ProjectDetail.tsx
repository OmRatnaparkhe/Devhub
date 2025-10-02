import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2, ArrowLeft, Github, ExternalLink, MessageSquare, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

// --- TYPE DEFINITIONS ---
type Technology = { id: string; name: string };
type User = { id: string; name: string; username: string; profilePic: string | null };
type Comment = {
  id: string;
  content: string;
  author: User;
  createdAt: string;
};
type Project = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  githubUrl: string;
  liveUrl: string | null;
  user: User;
  technologies: Technology[];
};

// --- MAIN COMPONENT ---
const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    // ... useEffect and handler functions remain the same
    const fetchData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        const [projectRes, commentsRes] = await Promise.all([
          fetch(`http://localhost:3000/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:3000/api/projects/${projectId}/getComments`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (!projectRes.ok) throw new Error("Failed to fetch project details");
        if (!commentsRes.ok) throw new Error("Failed to fetch comments");
        setProject(await projectRes.json());
        setComments(await commentsRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, getToken]);

   const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // This is the most important fix
    if (!newComment.trim()) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      const savedComment = await response.json();
      setComments(prevComments => [...prevComments, savedComment]);
      setNewComment("");
      setActiveTab("discussions"); // Keep the discussions tab open
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };
 const handleCommentDelete = async (commentId: string) => {
    const originalComments = [...comments];
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/projects/comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setComments(originalComments);
    }
  };

  if (isLoading) { /* ... loading JSX ... */ }
  if (!project) { /* ... not found JSX ... */ }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header and Back Button */}
        <div className="mb-6">
          <Link to="/projects">
            <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button>
          </Link>
        </div>

        {/* --- NEW SINGLE-COLUMN LAYOUT --- */}
        <div className="space-y-8">
          {/* Project Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-center items-center gap-24 items-start">
                <div>
                  <h1 className="text-3xl font-bold">{project?.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project?.user?.profilePic || undefined} />
                      <AvatarFallback>{project?.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>By {project?.user.name}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  {project?.liveUrl && (
                    <a href={project?.liveUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm"><ExternalLink className="mr-2 h-4 w-4" /> Live Demo</Button>
                    </a>
                  )}
                  <a href={project?.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><Github className="mr-2 h-4 w-4" /> GitHub</Button>
                  </a>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* --- NEW TABS COMPONENT --- */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="about"><Info className="mr-2 h-4 w-4" /> About Project</TabsTrigger>
              <TabsTrigger value="discussions"><MessageSquare className="mr-2 h-4 w-4" /> Discussions ({comments?.length})</TabsTrigger>
            </TabsList>

            {/* About Tab Content */}
            <TabsContent value="about">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground mb-6">{project?.description}</p>
                  <h3 className="font-semibold mb-3">Technologies Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {project?.technologies.map((tech) => (
                      <Badge key={tech.id} variant="secondary">{tech.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discussions Tab Content */}
            <TabsContent value="discussions">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map(comment => (
                        <div key={comment.id} className="group flex gap-3 items-start">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author?.profilePic || undefined} />
                            <AvatarFallback>{comment.author?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="bg-muted p-2 rounded-lg w-full">
                            <p className="font-semibold text-sm">{comment.author?.name}</p>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          {user?.id === comment.author?.id && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleCommentDelete(comment.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No discussions yet. Be the first to comment!</p>
                    )}
                  </div>
                  <form onSubmit={handleCommentSubmit} className="mt-6 flex gap-2">
                    <input
                      placeholder="Ask a question or report a bug..."
                      className="w-full bg-muted border rounded-md p-2 text-sm"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button type="submit" size="sm">Post</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;