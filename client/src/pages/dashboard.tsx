import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MoreHorizontal, 
  Plus, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-700 hover:bg-green-100";
    case "generating": return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "pending": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "failed": return "bg-red-100 text-red-700 hover:bg-red-100";
    default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed": return "Completed";
    case "generating": return "Generating";
    case "pending": return "Pending";
    case "failed": return "Failed";
    default: return status;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const userId = user?.uid || "demo-user";
        const response = await fetch(`/api/projects?userId=${userId}`);
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  const inProgressCount = projects.filter(p => p.status === "generating").length;
  const completedCount = projects.filter(p => p.status === "completed").length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back{user ? `, ${user.email?.split('@')[0]}` : ""}</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `You have ${inProgressCount} project${inProgressCount !== 1 ? 's' : ''} in progress and ${completedCount} completed.`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/manual-create">
              <Button size="lg" variant="outline" className="shadow-sm" data-testid="button-create-manually">
                <Plus className="mr-2 h-4 w-4" /> Create Manually
              </Button>
            </Link>
            <Link href="/autopilot">
              <Button size="lg" className="shadow-sm" data-testid="button-generate-ai">
                <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-projects">{projects.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-in-progress">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">Generating now</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Ready to export</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="py-20">
              <CardContent className="text-center space-y-4">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create manually or generate with AI</p>
                </div>
                <div className="flex gap-3">
                  <Link href="/manual-create">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Create Manually
                    </Button>
                  </Link>
                  <Link href="/autopilot">
                    <Button>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => {
                const coverColors = ["bg-indigo-100", "bg-emerald-100", "bg-blue-100", "bg-amber-100", "bg-pink-100", "bg-purple-100"];
                const iconColors = ["text-indigo-600", "text-emerald-600", "text-blue-600", "text-amber-600", "text-pink-600", "text-purple-600"];
                const colorIndex = project.id % coverColors.length;
                
                return (
                  <Card key={project.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60" data-testid={`card-project-${project.id}`} onClick={() => window.location.href = `/project/${project.id}`}>
                      <CardHeader className={`relative pb-10 pt-8 ${coverColors[colorIndex]} bg-opacity-40 border-b border-border/10`}>
                      <div className={`h-12 w-12 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4 ${iconColors[colorIndex]}`}>
                        {project.status === "generating" ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </div>
                      <Badge className={`absolute top-4 right-4 shadow-none ${getStatusColor(project.status)} border-0`} data-testid={`badge-status-${project.id}`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors" data-testid={`text-title-${project.id}`}>
                        {project.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 h-10">
                        {project.style?.replace(/_/g, " ") || "Commercial ebook"}
                      </CardDescription>
                      
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span data-testid={`text-progress-${project.id}`}>{project.generationProgress}%</span>
                        </div>
                        <Progress value={project.generationProgress} className="h-1.5" />
                        {project.currentStep && (
                          <p className="text-xs text-muted-foreground mt-1">{project.currentStep}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 pt-4 text-xs text-muted-foreground flex justify-between items-center">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
