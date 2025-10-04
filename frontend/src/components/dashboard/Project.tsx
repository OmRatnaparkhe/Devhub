import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Github, ExternalLink, Code2, Loader2, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import ProjectInputModal from "@/components/ProjectInputModal";
import { Input } from "../ui/input";
import { Link } from "react-router-dom";
type Technology = { id: string; name: string };
type User = { name: string; username: string; profilePic: string | null };
type Project = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  githubUrl: string;
  liveUrl: string | null;
  date: string;
  user: User;
  technologies: Technology[];
};

const FeedProjectCard = ({ project }: { project: Project }) => (
  <Card className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/20">
    <Link to={`/projects/${project.id}`}>
    <CardHeader className="p-4 bg-muted/30 border-b">
      <div className="flex items-center gap-3">
        <img
          src={project.user.profilePic || "/api/placeholder/40/40"}
          alt={project.user.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold text-sm">{project.user.name}</p>
          <p className="text-xs text-muted-foreground">@{project.user.username}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4">
      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
        <img
          src={project.thumbnail || "/api/placeholder/400/225"}
          alt={project.title}
          className="object-cover w-full h-full"
        />
      </div>
      <h3 className="font-bold mb-1">{project.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.technologies.map((tech) => (
          <Badge key={tech.id} variant="secondary">
            {tech.name}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button size="sm" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
            </Button>
          </a>
        )}
        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button size="sm" variant="outline" className="w-full">
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>
        </a>
      </div>
    </CardContent>
    </Link>
  </Card>
);

const Projects = () => {
  const [feedProjects, setFeedProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryMyProjects, setSearchQueryMyProjects] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { getToken, userId } = useAuth();

  const fetchDashboardFeed = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/dashboard/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      setFeedProjects(await res.json());
    } catch (err) {
      console.error("Error fetching feed projects:", err);
    }
  };

  const fetchUserProjects = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_PROD}api/projects/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user projects");
      setUserProjects(await res.json());
    } catch (err) {
      console.error("Error fetching user projects:", err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchDashboardFeed(), fetchUserProjects()]);
      setIsLoading(false);
    };
    fetchAll();
  }, [userId]);

  // Filtered lists (search applies to title + description + techs)
  const filteredUserProjects = useMemo(() => {
    if (!searchQueryMyProjects) return userProjects;
    return userProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQueryMyProjects.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQueryMyProjects.toLowerCase()) ||
        p.technologies.some((t) =>
          t.name.toLowerCase().includes(searchQueryMyProjects.toLowerCase())
        )
    );
  }, [userProjects, searchQueryMyProjects]);

  const filteredFeedProjects = useMemo(() => {
    if (!searchQuery) return feedProjects;
    return feedProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.technologies.some((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [feedProjects, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Row 1: Your Projects */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
          {/* Search under title */}
          <div className="relative w-full max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your projects..."
              className="pl-10"
              value={searchQueryMyProjects}
              onChange={(e) => setSearchQueryMyProjects(e.target.value)}
            />
          </div>
          {filteredUserProjects.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUserProjects.map((p) => (
                 
                <FeedProjectCard key={p.id} project={p} />
               
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Code2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground">
                Try a different search or add a new project.
              </p>
            </Card>
          )}
        </section>

        {/* Row 2: Followed Developers */}
        <section>
          <h2 className="text-2xl font-bold mb-3">From Developers You Follow</h2>
          {/* Search under title */}
          <div className="relative w-full max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search followed projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredFeedProjects.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeedProjects.map((project) => (
                <FeedProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Code2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground">
                Try a different search or follow more developers.
              </p>
            </Card>
          )}
        </section>
      </div>

      <ProjectInputModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={fetchUserProjects}
      />
    </div>
  );
};

export default Projects;
