import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Chapter {
  id: string;
  title: string;
  instructions: string;
}

export default function ManualCreate() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bookTitle, setBookTitle] = useState("");
  const [style, setStyle] = useState("modern_mag");
  const [language, setLanguage] = useState("en");
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: "1", title: "", instructions: "" }
  ]);
  const [creating, setCreating] = useState(false);

  const addChapter = () => {
    setChapters([...chapters, { id: Date.now().toString(), title: "", instructions: "" }]);
  };

  const removeChapter = (id: string) => {
    if (chapters.length > 1) {
      setChapters(chapters.filter(ch => ch.id !== id));
    }
  };

  const updateChapter = (id: string, field: 'title' | 'instructions', value: string) => {
    setChapters(chapters.map(ch => 
      ch.id === id ? { ...ch, [field]: value } : ch
    ));
  };

  const handleCreate = async () => {
    if (!bookTitle.trim()) {
      toast({ title: "Error", description: "Please enter a book title", variant: "destructive" });
      return;
    }

    const validChapters = chapters.filter(ch => ch.title.trim());
    if (validChapters.length === 0) {
      toast({ title: "Error", description: "Please add at least one chapter", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/projects/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "demo-user",
          title: bookTitle,
          style,
          primaryLanguage: language,
          chapters: validChapters.map((ch, idx) => ({
            chapterNumber: idx + 1,
            title: ch.title,
            instructions: ch.instructions
          }))
        })
      });

      if (!response.ok) throw new Error("Failed to create project");

      const project = await response.json();
      toast({ title: "Project Created!", description: "You can now generate chapters with your custom instructions" });
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error("Failed to create manual project:", error);
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Manually</h1>
            <p className="text-sm text-muted-foreground">Define your ebook structure and chapter instructions</p>
          </div>
        </div>

        {/* Book Info */}
        <Card>
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
            <CardDescription>Set up your ebook details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                placeholder="e.g., The Ultimate Keto Guide"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                data-testid="input-book-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Visual Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style" data-testid="select-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern_mag">Modern Magazine</SelectItem>
                    <SelectItem value="recipe_book">Recipe Book</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Chapters</CardTitle>
              <CardDescription>Define chapter titles and generation instructions</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addChapter} data-testid="button-add-chapter">
              <Plus className="mr-2 h-4 w-4" /> Add Chapter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapters.map((chapter, index) => (
              <div key={chapter.id} className="border rounded-lg p-4 space-y-3" data-testid={`chapter-${index}`}>
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">Chapter {index + 1}</Badge>
                  <div className="flex-1" />
                  {chapters.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChapter(chapter.id)}
                      data-testid={`button-remove-chapter-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`chapter-title-${chapter.id}`}>Chapter Title *</Label>
                  <Input
                    id={`chapter-title-${chapter.id}`}
                    placeholder="e.g., Introduction to Keto"
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                    data-testid={`input-chapter-title-${index}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`chapter-instructions-${chapter.id}`}>
                    Instructions for AI Generation (optional)
                  </Label>
                  <Textarea
                    id={`chapter-instructions-${chapter.id}`}
                    placeholder="Describe what this chapter should cover, tone, key points, etc. AI will use these instructions to generate content."
                    value={chapter.instructions}
                    onChange={(e) => updateChapter(chapter.id, 'instructions', e.target.value)}
                    rows={3}
                    className="text-sm"
                    data-testid={`input-chapter-instructions-${index}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate("/")} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating} data-testid="button-create-project">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
