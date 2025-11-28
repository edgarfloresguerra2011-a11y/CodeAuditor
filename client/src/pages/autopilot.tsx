import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Zap, 
  Globe, 
  Smartphone, 
  ShoppingCart, 
  CheckCircle2, 
  Loader2,
  BarChart3,
  Search,
  BookOpen,
  PenTool,
  Image as ImageIcon,
  Share2,
  TrendingUp,
  Utensils,
  Palette,
  Layers,
  Download,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Styles for the book generation
const STYLES = [
  { id: "modern_mag", label: "Modern Magazine", icon: Layers, description: "Visual-heavy, 3-column layout, bold typography." },
  { id: "recipe_book", label: "Cookbook / Recipe", icon: Utensils, description: "Full-page food photography, step-by-step grids." },
  { id: "minimalist", label: "Minimalist Guide", icon: FileText, description: "Clean whitespace, focus on readability." },
  { id: "vibrant", label: "Vibrant & Pop", icon: Palette, description: "High contrast, colorful, engaging for social." },
];

const STEPS = [
  { id: 1, label: "Scanning Global Trends (TikTok/Instagram)", icon: TrendingUp, duration: 2000 },
  { id: 2, label: "Identifying High-Viral Potential Topics", icon: Search, duration: 1500 },
  { id: 3, label: "Structuring Commercial Outline (Short & Punchy)", icon: BarChart3, duration: 2000 },
  { id: 4, label: "Generating Visuals (Midjourney v6)", icon: ImageIcon, duration: 3000 },
  { id: 5, label: "Translating & Localizing Content", icon: Globe, duration: 2000 },
  { id: 6, label: "Assembling Layout & Typography", icon: Layers, duration: 2500 },
  { id: 7, label: "Packaging Formats (EPUB, PDF, ZIP)", icon: Download, duration: 1500 },
];

export default function AutopilotPage() {
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("modern_mag");
  const [generatedProjectId, setGeneratedProjectId] = useState<number | null>(null);
  const [currentStepText, setCurrentStepText] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Configuration State
  const [config, setConfig] = useState({
    primaryLanguage: "en",
    targetLanguages: ["es", "fr"],
    formats: ["epub", "pdf", "zip"],
    autoPublish: true
  });

  // Poll for generation status
  useEffect(() => {
    if (status === "running" && generatedProjectId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/projects/${generatedProjectId}/status`);
          const data = await response.json();
          
          setProgress(data.progress || 0);
          setCurrentStepText(data.currentStep || "");
          
          if (data.progress > 0) {
            setLogs(prev => {
              const newLog = `> ${data.currentStep}... (${data.progress}%)`;
              if (prev[prev.length - 1] !== newLog) {
                return [...prev, newLog];
              }
              return prev;
            });
          }
          
          if (data.status === "completed") {
            setStatus("completed");
            clearInterval(pollInterval);
            toast({
              title: "Generation Complete!",
              description: "Your ebook has been generated successfully.",
            });
          } else if (data.status === "failed") {
            setStatus("failed");
            clearInterval(pollInterval);
            toast({
              title: "Generation Failed",
              description: data.currentStep || "An error occurred.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [status, generatedProjectId, toast]);

  const startAutomation = async () => {
    setStatus("running");
    setLogs(["Initializing autopilot..."]);
    setProgress(0);
    setCurrentStep(0);
    
    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "demo-user",
          style: selectedStyle,
          primaryLanguage: config.primaryLanguage,
          targetLanguages: config.targetLanguages,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start generation");
      }
      
      const project = await response.json();
      setGeneratedProjectId(project.id);
      setLogs(prev => [...prev, `Project #${project.id} created. Starting generation...`]);
      
    } catch (error) {
      console.error("Error starting automation:", error);
      setStatus("failed");
      toast({
        title: "Failed to Start",
        description: "Could not start the automation process.",
        variant: "destructive",
      });
    }
  };

  const renderStepIcon = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    if (!step) return null;
    const IconComponent = step.icon;
    return <IconComponent className="h-12 w-12 text-primary animate-bounce" />;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
              Commercial Autopilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate high-demand, visual-heavy commercial ebooks in minutes.
            </p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
               <Globe className="h-3 w-3 mr-1" /> Multi-Language Active
             </Badge>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-12 gap-8"
            >
              {/* Left: Configuration */}
              <div className="md:col-span-8 space-y-6">
                <Card className="border-amber-100 shadow-lg shadow-amber-500/5 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-600" />
                  <CardContent className="p-8 space-y-8">
                    
                    {/* Style Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" /> Visual Style & Format
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {STYLES.map((style) => {
                          const Icon = style.icon;
                          const isSelected = selectedStyle === style.id;
                          return (
                            <div 
                              key={style.id}
                              onClick={() => setSelectedStyle(style.id)}
                              className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected 
                                  ? "border-amber-500 bg-amber-50/50" 
                                  : "border-border hover:border-amber-200 hover:bg-accent/50"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${isSelected ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">{style.label}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{style.description}</p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-3 right-3 text-amber-600">
                                  <CheckCircle2 className="h-5 w-5 fill-amber-100" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Language & Market */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" /> Languages
                        </h3>
                        <div className="space-y-2">
                          <Label>Source Language</Label>
                          <Select 
                            value={config.primaryLanguage} 
                            onValueChange={(v) => setConfig({...config, primaryLanguage: v})}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English (US)</SelectItem>
                              <SelectItem value="es">Spanish (ES)</SelectItem>
                              <SelectItem value="fr">French (FR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Auto-Translate To</Label>
                          <div className="flex gap-2 flex-wrap">
                            {["Spanish", "French", "German", "Italian", "Portuguese"].map(lang => (
                              <Badge key={lang} variant="secondary" className="cursor-pointer hover:bg-secondary/80">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Download className="h-5 w-5 text-primary" /> Deliverables
                        </h3>
                        <div className="space-y-3">
                          {['EPUB (E-readers)', 'PDF (Print/Web)', 'ZIP (Assets)', 'Social Media Mockups'].map((fmt) => (
                            <div key={fmt} className="flex items-center justify-between p-2 border rounded bg-muted/20">
                              <span className="text-sm">{fmt}</span>
                              <Switch defaultChecked />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full h-16 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.01]"
                      onClick={startAutomation}
                    >
                      <Sparkles className="mr-2 h-6 w-6 animate-pulse" />
                      Generate Commercial Product
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Preview/Info */}
              <div className="md:col-span-4 space-y-6">
                 <Card className="bg-zinc-950 text-white border-zinc-800 overflow-hidden">
                   <div className="aspect-[3/4] bg-zinc-900 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                        <ImageIcon className="h-16 w-16 opacity-20" />
                      </div>
                      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">Preview Style</p>
                        <h3 className="font-serif text-xl">Modern Magazine Layout</h3>
                      </div>
                   </div>
                   <CardContent className="p-6">
                     <h4 className="font-medium mb-2 text-zinc-200">What you get:</h4>
                     <ul className="space-y-2 text-sm text-zinc-400">
                       <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 35-50 Pages of Content</li>
                       <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 15+ Midjourney Images</li>
                       <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Mobile-First Design</li>
                       <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Commercial License</li>
                     </ul>
                   </CardContent>
                 </Card>
              </div>
            </motion.div>
          )}

          {status === "running" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-8 py-12"
            >
              <Card className="border-2 border-primary/20 overflow-hidden relative bg-background/50 backdrop-blur">
                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
                
                <CardContent className="p-12 text-center space-y-8 relative z-10">
                  <div className="h-40 w-40 mx-auto relative">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-4 border-dashed border-primary/50 animate-[spin_8s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {renderStepIcon(currentStep)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold">{STEPS[currentStep]?.label || "Finalizing..."}</h2>
                    <div className="w-full max-w-md mx-auto space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs font-mono text-muted-foreground">
                        <span>Step {currentStep + 1}/{STEPS.length}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-48 bg-black/90 rounded-lg p-4 text-left font-mono text-xs text-green-400 overflow-hidden shadow-inner border border-slate-800">
                    <div className="flex flex-col-reverse h-full overflow-y-auto">
                      {logs.map((log, i) => (
                        <div key={i} className="opacity-90 border-l-2 border-green-800 pl-2 mb-1">
                          <span className="text-green-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-4 text-green-900 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-lg">Commercial Product Ready!</h3>
                  <p className="text-green-700">Generated "The Viral Keto Cookbook 2025" in 5 languages.</p>
                </div>
                <div className="sm:ml-auto flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white border-none">
                    <Download className="mr-2 h-4 w-4" /> Download All
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                {/* Product Visuals */}
                <div className="space-y-6">
                  {/* 3D Magazine Mockup */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center relative shadow-inner border border-white overflow-hidden group perspective-1000">
                    <div className="relative w-64 h-80 bg-white shadow-2xl transform rotate-y-12 rotate-x-6 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-105">
                       {/* Cover Design */}
                       <div className="absolute inset-0 bg-orange-500 p-6 flex flex-col">
                          <h1 className="text-4xl font-black text-white leading-none mb-2">KETO<br/>VIBES</h1>
                          <span className="text-white/80 font-bold tracking-widest text-sm">2025 EDITION</span>
                          <div className="mt-auto h-40 bg-slate-900 rounded-lg overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                              <Utensils className="h-12 w-12" />
                            </div>
                          </div>
                       </div>
                       {/* Spine */}
                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-orange-700 origin-right transform -translate-x-full -rotate-y-90" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                      <Smartphone className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs">Mobile Preview</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                      <Globe className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs">Web Preview</span>
                    </Button>
                  </div>
                </div>

                {/* Generated Assets List */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Generated Assets</h2>
                    <p className="text-muted-foreground">Everything stored securely in Firebase Storage.</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documents</h3>
                    <div className="space-y-2">
                      {[
                        { lang: "English (US)", file: "keto-vibes-2025-en.epub", size: "12.4 MB" },
                        { lang: "Spanish (ES)", file: "keto-vibes-2025-es.epub", size: "12.4 MB" },
                        { lang: "French (FR)", file: "keto-vibes-2025-fr.epub", size: "12.4 MB" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{item.lang}</div>
                              <div className="text-xs text-muted-foreground">{item.file}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{item.size}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Media & Social</h3>
                    <div className="grid grid-cols-4 gap-2">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="aspect-square bg-muted rounded-lg relative overflow-hidden hover:ring-2 ring-primary cursor-pointer">
                           <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                             <ImageIcon className="h-6 w-6" />
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStatus("idle")}>
                      <Sparkles className="mr-2 h-4 w-4" /> New Generation
                    </Button>
                    <Button className="flex-1 bg-black text-white hover:bg-zinc-800">
                      Publish to Store
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
