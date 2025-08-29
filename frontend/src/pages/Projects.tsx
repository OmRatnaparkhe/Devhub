import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ExternalLink,
  Github,
  Eye,
  Heart,
  Star,
  Calendar,
  Code2
} from "lucide-react";
import { useEffect, useState } from "react";

const Projects = () => {
  const dummyprojects = [
    {
      id: 1,
      title: "DevHub Platform",
      description: "A comprehensive developer platform built with React, TypeScript, and Supabase. Features include project showcasing, blogging, and community interaction.",
      image: "/api/placeholder/400/240",
      tech: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
      category: "Full-Stack",

      stats: {
        views: 1234,
        likes: 89,
        stars: 156
      },
      links: {
        live: "https://devhub.example.com",
        github: "https://github.com/user/devhub"
      },
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "AI Code Assistant",
      description: "An intelligent code completion and suggestion tool powered by machine learning. Supports multiple programming languages and integrates with popular IDEs.",
      image: "/api/placeholder/400/240",
      tech: ["Python", "TensorFlow", "FastAPI", "Docker"],
      category: "AI/ML",

      stats: {
        views: 892,
        likes: 67,
        stars: 234
      },
      links: {
        live: "https://ai-assistant.example.com",
        github: "https://github.com/user/ai-assistant"
      },
      createdAt: "2024-02-20"
    },
    {
      id: 3,
      title: "Crypto Portfolio Tracker",
      description: "Real-time cryptocurrency portfolio tracking application with beautiful charts, price alerts, and portfolio analytics.",
      image: "/api/placeholder/400/240",
      tech: ["Vue.js", "Chart.js", "Node.js", "MongoDB"],
      category: "Web App",

      stats: {
        views: 756,
        likes: 45,
        stars: 98
      },
      links: {
        live: "https://crypto-tracker.example.com",
        github: "https://github.com/user/crypto-tracker"
      },
      createdAt: "2024-03-10"
    },
    {
      id: 4,
      title: "Task Management CLI",
      description: "A powerful command-line task management tool with features like project organization, time tracking, and team collaboration.",
      image: "/api/placeholder/400/240",
      tech: ["Rust", "CLI", "SQLite", "Git"],
      category: "CLI Tool",

      stats: {
        views: 445,
        likes: 23,
        stars: 67
      },
      links: {
        live: "https://crates.io/crates/task-cli",
        github: "https://github.com/user/task-cli"
      },
      createdAt: "2024-03-25"
    },
    {
      id: 5,
      title: "React Component Library",
      description: "A modern, accessible component library built with React and TypeScript. Includes 50+ components with full Storybook documentation.",
      image: "/api/placeholder/400/240",
      tech: ["React", "TypeScript", "Storybook", "Rollup"],
      category: "Library",

      stats: {
        views: 623,
        likes: 34,
        stars: 145
      },
      links: {
        live: "https://components.example.com",
        github: "https://github.com/user/react-components"
      },
      createdAt: "2024-04-05"
    },
    {
      id: 6,
      title: "E-commerce Analytics Dashboard",
      description: "Advanced analytics dashboard for e-commerce businesses with real-time metrics, sales forecasting, and customer insights.",
      image: "/api/placeholder/400/240",
      tech: ["Next.js", "D3.js", "PostgreSQL", "Redis"],
      category: "Dashboard",

      stats: {
        views: 978,
        likes: 56,
        stars: 189
      },
      links: {
        live: "https://analytics.example.com",
        github: "https://github.com/user/analytics-dashboard"
      },
      createdAt: "2024-04-18"
    }
  ];

  const categories = ["All", "Full-Stack", "Web App", "AI/ML", "CLI Tool", "Library", "Dashboard"];
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  useEffect(() => {
    setProjects(dummyprojects)
  }, [])
  const uniqueTechnologies = Array.from(new Set(dummyprojects.flatMap(project => project.tech || [])));
  const selectProjects = dummyprojects.filter(project => {
    const matchesTech = selectedTech ? project.tech?.includes(selectedTech) : true;
    const matchesSearch = project.title.toLowerCase().includes((searchQuery ?? "").trim().toLowerCase())
    return matchesTech && matchesSearch;
  })
      
  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Developer Projects</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore amazing projects built by talented developers in our community.
              Get inspired and discover new technologies.
            </p>
          </div>

          {/* Search and Filter in vertical layout */}
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                className="pl-10 w-full"
                onChange={(e)=> setSearchQuery(e.target.value)}
              />
            </div>

            {/* Technology Filters */}
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setSelectedTech(null)}
                className={`px-3 py-1 rounded-full border ${selectedTech === null ? 'bg-white text-black' : 'bg-black text-white'}`}>
                All
              </button>
              {uniqueTechnologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3 py-1 rounded-full border ${selectedTech === tech ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {tech}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Unified Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {selectProjects.length === 0 ? (
            <p className="text-center col-span-full text-muted-foreground">No projects found</p>
          ): (
            selectProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/20">
              <div className="aspect-video bg-gradient-card rounded-t-lg mb-4 flex items-center justify-center">
                <Code2 className="h-12 w-12 text-muted-foreground" />
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {project.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="mb-4 line-clamp-2">
                  {project.description}
                </CardDescription>

                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tech.slice(0, 3).map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.tech.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tech.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{project.stats.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{project.stats.likes}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{project.stats.stars}</span>
                  </div>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Live Demo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          )
          }
          
        </div>

      </div>

    </div >
  );
};

export default Projects;