import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  Download,
  Share2,
  Eye,
  FileText,
  Image as ImageIcon,
  Globe,
  Smartphone,
  Monitor,
  Loader2,
  CheckCircle2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectView() {
  // Global CSS for chapter content formatting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .prose p {
        text-align: justify !important;
        margin: 1em 0 !important;
        line-height: 1.8 !important;
      }
      .prose strong {
        color: #000 !important;
        font-weight: 600 !important;
      }
      .prose ul, .prose ol {
        margin: 1em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      .prose ul {
        list-style-type: disc !important;
      }
      .prose li {
        margin: 0.5em 0 !important;
        text-align: justify !important;
      }
      .prose blockquote {
        border-left: 4px solid #ddd !important;
        margin: 1.5em 0 !important;
        padding: 1em !important;
        background: #f9f9f9 !important;
        font-style: italic !important;
        color: #666 !important;
      }
      .prose h3 {
        font-size: 1.3em !important;
        margin-top: 1.5em !important;
        margin-bottom: 0.5em !important;
        color: #333 !important;
        font-weight: 600 !important;
      }
      .prose h2 {
        font-size: 1.8em !important;
        margin-top: 1em !important;
        margin-bottom: 0.5em !important;
        color: #222 !important;
        font-weight: 700 !important;
      }
      .prose .tip-box {
        background: #fff3cd !important;
        border-left: 4px solid #ffc107 !important;
        padding: 1em !important;
        margin: 1.5em 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const { id } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        console.log("Project data:", data);
        setProject(data);
        if (data.primaryLanguage) {
          setSelectedLanguage(data.primaryLanguage);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out "${project?.title}" - AI-generated commercial ebook`;
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      instagram: url,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    } else if (platform === 'instagram') {
      toast({ title: "Instagram", description: "Copy link and share on Instagram app" });
      navigator.clipboard.writeText(url);
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleDownload = (format: string) => {
    if (!project?.exports) {
      toast({ title: "Error", description: "No downloads available yet" });
      return;
    }

    const exportFile = project.exports.find(
      (exp: any) => exp.format === format && exp.language === selectedLanguage
    );

    if (exportFile) {
      const link = document.createElement('a');
      link.href = exportFile.fileUrl;
      link.download = exportFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: `Downloading ${format.toUpperCase()}`,
        description: `${exportFile.fileName}`,
      });
    } else {
      toast({ title: "Error", description: `${format.toUpperCase()} not available for this language` });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <Link href="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isCompleted = project.status === "completed";
  const isManual = project.mode === "manual";
  const mockup3d = project.mockups?.find((m: any) => m.type === "3d");
  const mockupMobile = project.mockups?.find((m: any) => m.type === "mobile");
  const mockupDesktop = project.mockups?.find((m: any) => m.type === "desktop");
  const chapters = project.chapters || [];
  const chapterInstructions = project.chapterInstructions || [];
  const translations = project.translations || [];
  const languages = [project.primaryLanguage, ...(project.targetLanguages || [])];
  const hasTranslations = translations.length > 0;

  const handleGenerateChapter = async (chapterInstructionId: number) => {
    try {
      toast({ title: "Generating...", description: "Creating chapter with AI" });
      const response = await fetch(`/api/projects/${id}/manual/generate-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterInstructionId })
      });
      
      if (!response.ok) throw new Error("Generation failed");
      
      const data = await response.json();
      
      // Update project state immediately with the returned data
      if (data.project) {
        setProject(data.project);
      }
      
      toast({ title: "Started", description: "Chapter generation in progress" });
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        const updateResponse = await fetch(`/api/projects/${id}`);
        const updatedData = await updateResponse.json();
        setProject(updatedData);
        
        const instruction = updatedData.chapterInstructions?.find((i: any) => i.id === chapterInstructionId);
        if (instruction && (instruction.status === "generated" || instruction.status === "failed")) {
          clearInterval(pollInterval);
          if (instruction.status === "generated") {
            toast({ title: "Complete!", description: "Chapter generated successfully" });
          } else {
            toast({ title: "Failed", description: "Chapter generation failed", variant: "destructive" });
          }
        }
      }, 3000);
      
      setTimeout(() => clearInterval(pollInterval), 90000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate chapter", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isCompleted ? "default" : "secondary"} className="bg-green-100 text-green-700">
                {isCompleted ? (
                  <><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</>
                ) : (
                  <>{project.status}</>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Generated with {project.style?.replace(/_/g, " ")} style
              </span>
            </div>
          </div>
          
          {isCompleted && (
            <Link href={`/magazine/${id}`}>
              <Button variant="outline" size="sm" data-testid="button-view-magazine">
                <Eye className="mr-2 h-4 w-4" />
                Sales Preview
              </Button>
            </Link>
          )}
        </div>

        {!isCompleted && !isManual && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Generation in progress...</h3>
                  <p className="text-sm text-yellow-700">
                    {project.currentStep || "Processing your ebook"} ({project.generationProgress}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isManual && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Manual Creation Mode</h2>
                    <p className="text-sm text-muted-foreground">Generate chapters with your custom instructions</p>
                  </div>
                  <Badge variant="outline">Manual</Badge>
                </div>

                <div className="space-y-3">
                  {chapterInstructions.map((instruction: any, index: number) => {
                    const chapterExists = chapters.find((ch: any) => ch.chapterNumber === instruction.chapterNumber);
                    const isGenerating = instruction.status === "generating";
                    const isGenerated = instruction.status === "generated" || chapterExists;

                    return (
                      <div key={instruction.id} className="border rounded-lg p-4" data-testid={`chapter-instruction-${index}`}>
                        <div className="flex items-start gap-4">
                          <Badge variant="secondary" className="mt-1">Ch. {instruction.chapterNumber}</Badge>
                          <div className="flex-1">
                            <h3 className="font-semibold">{instruction.title}</h3>
                            {instruction.instructions && (
                              <p className="text-sm text-muted-foreground mt-1">{instruction.instructions}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isGenerating && (
                              <Badge variant="outline" className="bg-yellow-50">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Generating
                              </Badge>
                            )}
                            {isGenerated && (
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Generated
                              </Badge>
                            )}
                            {!isGenerated && !isGenerating && (
                              <Button 
                                size="sm"
                                onClick={() => handleGenerateChapter(instruction.id)}
                                data-testid={`button-generate-chapter-${index}`}
                              >
                                Generate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <>
            {/* Preview & Mockups Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 3D Mockup */}
              <Card className="overflow-hidden">
                <CardContent className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge variant="outline" className="bg-white">3D Preview</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-6 px-2 text-xs bg-white"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/projects/${id}/mockups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                          const data = await response.json();
                          toast({ title: "Mockups Generated", description: "Refresh to see new mockups" });
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to generate mockups", variant: "destructive" });
                        }
                      }}
                      data-testid="button-generate-mockups"
                    >
                      🎨 Generate
                    </Button>
                  </div>
                  
                  {mockup3d?.imageUrl ? (
                    <div className="aspect-[4/3] rounded-lg overflow-hidden">
                      <img 
                        src={mockup3d.imageUrl} 
                        alt="3D Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No 3D mockup available</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {mockupMobile?.imageUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => window.open(mockupMobile.imageUrl, '_blank')}
                      >
                        <Smartphone className="mr-1 h-3 w-3" /> Mobile
                      </Button>
                    )}
                    {mockupDesktop?.imageUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => window.open(mockupDesktop.imageUrl, '_blank')}
                      >
                        <Monitor className="mr-1 h-3 w-3" /> Desktop
                      </Button>
                    )}
                    {mockup3d?.imageUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => window.open(mockup3d.imageUrl, '_blank')}
                      >
                        <Eye className="mr-1 h-3 w-3" /> Preview
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Download & Share */}
              <div className="space-y-6">
                {/* Download Section */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      Download Formats
                    </h3>
                    
                    {hasTranslations && (
                      <div className="mb-4 pb-4 border-b">
                        <label className="text-sm font-medium mb-2 block">Language</label>
                        <select 
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        >
                          {languages.map((lang: string) => (
                            <option key={lang} value={lang}>
                              {lang.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-12"
                        onClick={() => handleDownload('epub')}
                        data-testid="button-download-epub"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">EPUB</div>
                            <div className="text-xs text-muted-foreground">For eReaders</div>
                          </div>
                        </div>
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-12"
                        onClick={() => handleDownload('pdf')}
                        data-testid="button-download-pdf"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-red-100 text-red-600 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">PDF</div>
                            <div className="text-xs text-muted-foreground">Print-ready format</div>
                          </div>
                        </div>
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-12"
                        onClick={() => handleDownload('zip')}
                        data-testid="button-download-zip"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">ZIP (Assets)</div>
                            <div className="text-xs text-muted-foreground">All images</div>
                          </div>
                        </div>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Share Section */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      Share
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleShare('twitter')}
                        data-testid="button-share-twitter"
                      >
                        <Twitter className="mr-2 h-4 w-4 fill-blue-400 text-blue-400" />
                        Twitter
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleShare('facebook')}
                        data-testid="button-share-facebook"
                      >
                        <Facebook className="mr-2 h-4 w-4 fill-blue-600 text-blue-600" />
                        Facebook
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleShare('linkedin')}
                        data-testid="button-share-linkedin"
                      >
                        <Linkedin className="mr-2 h-4 w-4 fill-blue-700 text-blue-700" />
                        LinkedIn
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleShare('instagram')}
                        data-testid="button-share-instagram"
                      >
                        <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                        Instagram
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => handleShare('copy')}
                      data-testid="button-copy-link"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Generated Content Tabs */}
            <Card>
              <Tabs defaultValue="content" className="w-full">
                <div className="border-b px-6 pt-6">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                    <TabsTrigger value="content" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <FileText className="mr-2 h-4 w-4" />
                      Chapters ({chapters.length})
                    </TabsTrigger>
                    <TabsTrigger value="images" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Images
                    </TabsTrigger>
                    {hasTranslations && (
                      <TabsTrigger value="translations" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        <Globe className="mr-2 h-4 w-4" />
                        Translations
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="mockups" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Marketing Mockups
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="content" className="p-6">
                  <div className="space-y-8">
                    {chapters && chapters.length > 0 ? (
                      chapters.map((chapter: any, index: number) => (
                        <div key={chapter.id} className="border-b pb-6 last:border-b-0">
                          <div className="flex items-start gap-4 mb-4">
                            <Badge variant="secondary">Chapter {chapter.chapterNumber}</Badge>
                            <h3 className="text-2xl font-bold flex-1">{chapter.title}</h3>
                          </div>
                          {chapter.imageUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden max-w-md">
                              <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-auto" />
                            </div>
                          )}
                          <div 
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: chapter.htmlContent }}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No chapters available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {project.images && Array.isArray(project.images) && project.images.length > 0 ? (
                      project.images.map((img: string, index: number) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                          <img src={img} alt={`Generated ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" onClick={() => window.open(img, '_blank')}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No images</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {hasTranslations && (
                  <TabsContent value="translations" className="p-6">
                    <div className="space-y-4">
                      {project.targetLanguages?.map((lang: string) => (
                        <div key={lang} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium capitalize">{lang}</div>
                              <div className="text-sm text-muted-foreground">Available</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="mockups" className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-semibold">Marketing Mockups</h3>
                        <p className="text-xs text-muted-foreground">AI-powered mockups for sales</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Link href={`/magazine/${id}`} className="flex-1 sm:flex-initial">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs h-8"
                            data-testid="button-sales-preview"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Sales Preview
                          </Button>
                        </Link>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="flex-1 sm:flex-initial bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs h-8"
                          onClick={async () => {
                            try {
                              toast({ title: "Generating...", description: "Creating marketing mockups with AI" });
                              const response = await fetch(`/api/projects/${id}/mockups`, { 
                                method: "POST", 
                                headers: { "Content-Type": "application/json" }, 
                                body: JSON.stringify({}) 
                              });
                              const data = await response.json();
                              toast({ title: "✓ Done", description: "Mockups ready! Refreshing..." });
                              setTimeout(() => window.location.reload(), 1500);
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to generate", variant: "destructive" });
                            }
                          }}
                          data-testid="button-generate-marketing-mockups"
                        >
                          <ImageIcon className="mr-1 h-3 w-3" />
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {/* Tablet Office Mockup */}
                      {(() => {
                        const mockup = project.mockups?.find((m: any) => m.type === "tablet_office");
                        return (
                          <Card className="overflow-hidden" data-testid="mockup-tablet-office">
                            <CardContent className="p-0">
                              {mockup?.imageUrl ? (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100">
                                  <img src={mockup.imageUrl} alt="Tablet Office" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                                  <div className="text-center text-muted-foreground">
                                    <Smartphone className="h-8 w-8 mx-auto mb-1 opacity-20" />
                                    <p className="text-xs">Tablet Office</p>
                                    <p className="text-[10px]">Not generated</p>
                                  </div>
                                </div>
                              )}
                              <div className="p-2 bg-white border-t">
                                <h4 className="font-semibold text-xs">Tablet on Desk</h4>
                                <p className="text-[10px] text-muted-foreground">Lifestyle shot</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* 3D Book Mockup */}
                      {(() => {
                        const mockup = project.mockups?.find((m: any) => m.type === "book_3d");
                        return (
                          <Card className="overflow-hidden" data-testid="mockup-book-3d">
                            <CardContent className="p-0">
                              {mockup?.imageUrl ? (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100">
                                  <img src={mockup.imageUrl} alt="3D Book" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                                  <div className="text-center text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-1 opacity-20" />
                                    <p className="text-xs">3D Book</p>
                                    <p className="text-[10px]">Not generated</p>
                                  </div>
                                </div>
                              )}
                              <div className="p-2 bg-white border-t">
                                <h4 className="font-semibold text-xs">3D Book Cover</h4>
                                <p className="text-[10px] text-muted-foreground">Realistic mockup</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* Multi-Device Mockup */}
                      {(() => {
                        const mockup = project.mockups?.find((m: any) => m.type === "multi_device");
                        return (
                          <Card className="overflow-hidden" data-testid="mockup-multi-device">
                            <CardContent className="p-0">
                              {mockup?.imageUrl ? (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100">
                                  <img src={mockup.imageUrl} alt="Multi-Device" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                                  <div className="text-center text-muted-foreground">
                                    <Monitor className="h-8 w-8 mx-auto mb-1 opacity-20" />
                                    <p className="text-xs">Multi-Device</p>
                                    <p className="text-[10px]">Not generated</p>
                                  </div>
                                </div>
                              )}
                              <div className="p-2 bg-white border-t">
                                <h4 className="font-semibold text-xs">Desktop + Tablet + Mobile</h4>
                                <p className="text-[10px] text-muted-foreground">Responsive</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
