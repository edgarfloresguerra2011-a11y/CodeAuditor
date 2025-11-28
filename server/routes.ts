import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { z } from "zod";
import path from "path";

const createProjectSchema = z.object({
  userId: z.string(),
  style: z.enum(["modern_mag", "recipe_book", "minimalist", "vibrant"]),
  primaryLanguage: z.string().default("en"),
  targetLanguages: z.array(z.string()).default([]),
});

const createApiConfigSchema = z.object({
  userId: z.string(),
  name: z.string(),
  type: z.string(),
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Download project endpoint
  app.get("/download/project", (req, res) => {
    const filePath = path.join("/home/runner", "ebook-platform.tar.gz");
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", "attachment; filename=ebook-platform.tar.gz");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "File not found" });
      }
    });
  });
  
  // Users endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const { id, email, displayName, photoURL } = req.body;
      if (!id || !email) return res.status(400).json({ error: "id and email required" });
      
      let user = await storage.getUser(id);
      if (!user) {
        user = await storage.createUser({
          id,
          email,
          displayName: displayName || null,
          photoURL: photoURL || null,
        });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Configurations endpoints
  app.post("/api/api-configs", async (req, res) => {
    try {
      const data = createApiConfigSchema.parse(req.body);
      const config = await storage.createApiConfig(data);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/api-configs", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });
      
      const configs = await storage.getApiConfigs(req.query.userId as string);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/api-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });
      
      const updated = await storage.updateApiConfig(id, req.body);
      res.json(updated || { success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/api-configs/:id", async (req, res) => {
    try {
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });

      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const chapters = await storage.getChaptersByProject(projectId);
      const mockups = await storage.getMockupsByProject(projectId);
      const exports = await storage.getExportsByProject(projectId);
      const chapterInstructions = project.mode === "manual" 
        ? await storage.getChapterInstructionsByProject(projectId)
        : [];

      console.log(`[DEBUG] Project ${projectId}: chapters=${chapters?.length || 0}, mockups=${mockups?.length || 0}, exports=${exports?.length || 0}`);

      const response = {
        ...project,
        chapters: chapters || [],
        mockups: mockups || [],
        exports: exports || [],
        translations: [],
        chapterInstructions: chapterInstructions || [],
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/generate", async (req, res) => {
    try {
      const data = createProjectSchema.parse(req.body);

      const project = await storage.createProject({
        ...data,
        title: "Generating...",
        status: "pending",
        generationProgress: 0,
        mode: "autopilot",
      });

      generateProjectContent(project.id, data.userId, data.style, data.primaryLanguage, data.targetLanguages).catch(err => {
        console.error("Generation failed:", err);
        storage.updateProjectStatus(project.id, "failed", 0, err.message);
      });

      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/projects/manual", async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string(),
        title: z.string(),
        style: z.enum(["modern_mag", "recipe_book", "minimalist", "vibrant"]),
        primaryLanguage: z.string().default("en"),
        chapters: z.array(z.object({
          chapterNumber: z.number(),
          title: z.string(),
          instructions: z.string().optional(),
        })),
      });

      const data = schema.parse(req.body);

      const project = await storage.createProject({
        userId: data.userId,
        title: data.title,
        style: data.style,
        status: "draft",
        mode: "manual",
        primaryLanguage: data.primaryLanguage,
        generationProgress: 0,
        targetLanguages: [],
      });

      for (const chapter of data.chapters) {
        await storage.createChapterInstruction({
          projectId: project.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          instructions: chapter.instructions || "",
        });
      }

      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/manual/generate-chapter", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const schema = z.object({
        chapterInstructionId: z.number(),
      });

      const { chapterInstructionId } = schema.parse(req.body);

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const instructions = await storage.getChapterInstructionsByProject(projectId);
      const chapterInstruction = instructions.find(i => i.id === chapterInstructionId);

      if (!chapterInstruction) {
        return res.status(404).json({ error: "Chapter instruction not found" });
      }

      await storage.updateChapterInstruction(chapterInstructionId, { status: "generating" });

      // Generate chapter asynchronously but return immediately
      generateManualChapter(
        projectId,
        project.userId,
        chapterInstruction,
        project.style,
        project.primaryLanguage
      ).catch(err => {
        console.error("Chapter generation failed:", err);
        storage.updateChapterInstruction(chapterInstructionId, { status: "failed" });
      });

      // Return fully hydrated project data
      const updatedProject = await storage.getProject(projectId);
      const chapterInstructionsUpdated = await storage.getChapterInstructionsByProject(projectId);
      const chaptersUpdated = await storage.getChaptersByProject(projectId);
      const mockupsUpdated = await storage.getMockupsByProject(projectId);
      const exportsUpdated = await storage.getExportsByProject(projectId);
      
      res.json({ 
        message: "Chapter generation started", 
        chapterId: chapterInstructionId,
        project: {
          ...updatedProject,
          chapterInstructions: chapterInstructionsUpdated,
          chapters: chaptersUpdated,
          mockups: mockupsUpdated,
          exports: exportsUpdated,
          translations: []
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id/status", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({
        status: project.status,
        progress: project.generationProgress,
        currentStep: project.currentStep,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/regenerate", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await storage.updateProjectStatus(projectId, "pending", 0, "Starting regeneration...");

      generateProjectContent(
        projectId, 
        project.userId, 
        project.style, 
        project.primaryLanguage, 
        project.targetLanguages
      ).catch(err => {
        console.error("Regeneration failed:", err);
        storage.updateProjectStatus(projectId, "failed", 0, err.message);
      });

      res.json({ message: "Regeneration started", projectId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/mockups", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get cover image (first chapter image)
      const chapters = await storage.getChaptersByProject(projectId);
      const coverImage = chapters[0]?.imageUrl;

      if (!coverImage) {
        return res.status(400).json({ error: "No cover image available for mockup generation" });
      }

      console.log(`[Mockups] Generating professional marketing mockups for "${project.title}"...`);

      // Generate 3 professional marketing mockups using Gemini Nano Banana
      const [tabletMockup, book3dMockup, multiDeviceMockup] = await Promise.all([
        aiService.generateMarketingMockup(project.userId, project.title, coverImage, "tablet_office"),
        aiService.generateMarketingMockup(project.userId, project.title, coverImage, "book_3d"),
        aiService.generateMarketingMockup(project.userId, project.title, coverImage, "multi_device"),
      ]);

      console.log(`[Mockups] ✓ All 3 professional mockups generated successfully`);

      // Save marketing mockups to database
      await storage.createMockup({
        projectId,
        type: "tablet_office",
        imageUrl: tabletMockup,
        metadata: { title: project.title, style: project.style, generated: new Date().toISOString() },
      });

      await storage.createMockup({
        projectId,
        type: "book_3d",
        imageUrl: book3dMockup,
        metadata: { title: project.title, style: project.style, generated: new Date().toISOString() },
      });

      await storage.createMockup({
        projectId,
        type: "multi_device",
        imageUrl: multiDeviceMockup,
        metadata: { title: project.title, style: project.style, generated: new Date().toISOString() },
      });

      res.json({ success: true, message: "Professional marketing mockups generated with Nano Banana" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateProjectContent(
  projectId: number,
  userId: string,
  style: string,
  primaryLanguage: string,
  targetLanguages: string[]
) {
  try {
    await storage.updateProjectStatus(projectId, "generating", 5, "Analyzing market trends...");
    const title = await aiService.analyzeTrends(userId, style);
    await storage.updateProject(projectId, { title });
    await storage.updateProjectStatus(projectId, "generating", 15, "Topic selected");

    await storage.updateProjectStatus(projectId, "generating", 20, "Creating outline...");
    const outline = await aiService.generateOutline(userId, title, style, primaryLanguage);
    await storage.updateProject(projectId, { outline });
    await storage.updateProjectStatus(projectId, "generating", 30, "Outline complete");

    await storage.updateProjectStatus(projectId, "generating", 35, "Generating content...");
    const chapterRecords = [];
    const images = [];
    
    for (let i = 0; i < outline.length; i++) {
      const chapter = outline[i];
      const content = await aiService.generateChapterContent(
        userId,
        chapter.title,
        chapter.description,
        style,
        primaryLanguage
      );
      
      // Apply grammar check and humanization for natural, error-free content
      let processedContent = content.content || "";
      
      console.log(`[Content Processing] Chapter ${i + 1}: Grammar check...`);
      processedContent = await aiService.checkGrammar(userId, processedContent, primaryLanguage);
      
      console.log(`[Content Processing] Chapter ${i + 1}: Humanizing...`);
      processedContent = await aiService.humanizeContent(userId, processedContent, primaryLanguage);
      
      const htmlContent = processedContent;
      let imageUrl = "";
      
      if (content.imagePrompt) {
        imageUrl = await aiService.generateImage(userId, content.imagePrompt, i);
        if (imageUrl) images.push(imageUrl);
      }
      
      const chapterRecord = await storage.createChapter({
        projectId,
        chapterNumber: i + 1,
        title: chapter.title,
        htmlContent,
        imageUrl: imageUrl || undefined,
        language: primaryLanguage,
      });
      
      chapterRecords.push(chapterRecord);
      
      const progress = 35 + ((i + 1) / outline.length) * 25;
      await storage.updateProjectStatus(projectId, "generating", Math.round(progress), `Chapter ${i + 1}/${outline.length}`);
    }

    await storage.updateProject(projectId, { 
      content: chapterRecords.map(c => ({ title: c.title, content: c.htmlContent })),
      images 
    });
    await storage.updateProjectStatus(projectId, "generating", 60, "Content generated");

    if (targetLanguages.length > 0) {
      await storage.updateProjectStatus(projectId, "generating", 65, "Translating...");
      
      for (let i = 0; i < targetLanguages.length; i++) {
        const lang = targetLanguages[i];
        
        for (const chapter of chapterRecords) {
          const translatedContent = await aiService.translateContent(userId, chapter.htmlContent, lang);
          await storage.createTranslation({
            projectId,
            language: lang,
            chapterId: chapter.id,
            translatedContent,
          });
        }
        
        const progress = 65 + ((i + 1) / targetLanguages.length) * 15;
        await storage.updateProjectStatus(projectId, "generating", Math.round(progress), `Translated to ${lang}`);
      }
    }

    await storage.updateProjectStatus(projectId, "generating", 80, "Translation complete");

    await storage.updateProjectStatus(projectId, "generating", 85, "Creating mockups & exports...");
    
    const allLanguages = [primaryLanguage, ...targetLanguages];
    
    for (const lang of allLanguages) {
      const fileNameBase = title.toLowerCase().replace(/\s+/g, '-');
      const langChapters = lang === primaryLanguage 
        ? chapterRecords 
        : (await storage.getTranslationsByProject(projectId)).filter((t: any) => t.language === lang);
      
      // Generate downloadable HTML ebook (readable in browser, can be saved as PDF)
      const htmlContent = langChapters.map((ch: any) => 
        `<div class="chapter"><h2>${ch.title}</h2><div class="content">${ch.htmlContent || ch.translatedContent || ''}</div></div>`
      ).join('\n');
      
      const fullHTML = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; background: #fff; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #000; border-bottom: 3px solid #333; padding-bottom: 0.3em; }
    h2 { font-size: 1.8em; margin-top: 2em; margin-bottom: 0.5em; color: #222; }
    h3 { font-size: 1.3em; margin-top: 1.5em; margin-bottom: 0.3em; color: #333; }
    p { margin: 1em 0; text-align: justify; }
    strong { color: #000; font-weight: 600; }
    em { font-style: italic; color: #444; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin: 0.5em 0; }
    blockquote { border-left: 4px solid #ddd; margin: 1.5em 0; padding-left: 1em; color: #666; font-style: italic; background: #f9f9f9; padding: 1em; }
    .chapter { page-break-after: always; margin-bottom: 3em; }
    .content { margin-top: 1em; }
    .tip-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 1em; margin: 1.5em 0; }
    @media print { body { margin: 0; padding: 20mm; } .chapter { page-break-after: always; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${htmlContent}
</body>
</html>`;
      
      const htmlDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`;
      
      await storage.createExport({
        projectId,
        format: "epub",
        language: lang,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${lang}.html`,
      });
      
      await storage.createExport({
        projectId,
        format: "pdf",
        language: lang,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${lang}-print.html`,
      });
      
      await storage.createExport({
        projectId,
        format: "zip",
        language: lang,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${lang}-complete.html`,
      });
    }

    await storage.createMockup({
      projectId,
      type: "3d",
      imageUrl: images[0] || "/placeholder-3d.jpg",
      metadata: { title, style },
    });

    await storage.createMockup({
      projectId,
      type: "mobile",
      imageUrl: images[1] || "/placeholder-mobile.jpg",
      metadata: { title, style },
    });

    await storage.createMockup({
      projectId,
      type: "desktop",
      imageUrl: images[2] || "/placeholder-desktop.jpg",
      metadata: { title, style },
    });

    await storage.updateProjectStatus(projectId, "completed", 100, "Generation complete");

  } catch (error: any) {
    console.error("Generation error:", error);
    await storage.updateProjectStatus(projectId, "failed", 0, error.message);
    throw error;
  }
}

async function generateManualChapter(
  projectId: number,
  userId: string,
  chapterInstruction: any,
  style: string,
  language: string
) {
  try {
    console.log(`[Manual Chapter] Generating "${chapterInstruction.title}" with custom instructions...`);

    const content = await aiService.generateChapterContent(
      userId,
      chapterInstruction.title,
      chapterInstruction.instructions || `Write a comprehensive chapter about ${chapterInstruction.title}`,
      style,
      language
    );

    let processedContent = content.content || "";

    console.log(`[Manual Chapter] Grammar check...`);
    processedContent = await aiService.checkGrammar(userId, processedContent, language);

    console.log(`[Manual Chapter] Humanizing...`);
    processedContent = await aiService.humanizeContent(userId, processedContent, language);

    const htmlContent = processedContent;
    let imageUrl = "";

    if (content.imagePrompt) {
      imageUrl = await aiService.generateImage(userId, content.imagePrompt, chapterInstruction.chapterNumber);
    }

    await storage.createChapter({
      projectId,
      chapterNumber: chapterInstruction.chapterNumber,
      title: chapterInstruction.title,
      htmlContent,
      imageUrl: imageUrl || undefined,
      language,
    });

    await storage.updateChapterInstruction(chapterInstruction.id, { status: "generated" });

    console.log(`[Manual Chapter] ✓ Chapter "${chapterInstruction.title}" generated successfully`);

    // Check if all chapters are now complete
    const allInstructions = await storage.getChapterInstructionsByProject(projectId);
    const allGenerated = allInstructions.every((inst: any) => inst.status === "generated");
    
    if (allGenerated) {
      console.log(`[Manual Project] All chapters generated! Creating exports...`);
      await storage.updateProjectStatus(projectId, "completed", 95, "Creating exports...");
      
      // Get all chapters and project details
      const project = await storage.getProject(projectId);
      if (!project) return;
      
      const allChapters = await storage.getChaptersByProject(projectId);
      
      // Generate HTML exports for manual project
      const htmlContent = allChapters.map((ch: any) => 
        `<div class="chapter"><h2>${ch.title}</h2><div class="content">${ch.htmlContent || ''}</div></div>`
      ).join('\n');
      
      const fullHTML = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${project.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; background: #fff; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #000; border-bottom: 3px solid #333; padding-bottom: 0.3em; }
    h2 { font-size: 1.8em; margin-top: 2em; margin-bottom: 0.5em; color: #222; }
    h3 { font-size: 1.3em; margin-top: 1.5em; margin-bottom: 0.3em; color: #333; }
    p { margin: 1em 0; text-align: justify; }
    strong { color: #000; font-weight: 600; }
    .chapter { page-break-after: always; margin-bottom: 3em; }
    .content { margin-top: 1em; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  ${htmlContent}
</body>
</html>`;
      
      const fileNameBase = project.title.toLowerCase().replace(/\s+/g, '-');
      const htmlDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`;
      
      await storage.createExport({
        projectId,
        format: "epub",
        language,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${language}.html`,
      });
      
      await storage.createExport({
        projectId,
        format: "pdf",
        language,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${language}-print.html`,
      });
      
      await storage.createExport({
        projectId,
        format: "zip",
        language,
        fileUrl: htmlDataUrl,
        fileName: `${fileNameBase}-${language}-complete.html`,
      });
      
      // Create placeholder mockups using chapter images
      const chapterImages = allChapters.map((ch: any) => ch.imageUrl).filter(Boolean);
      
      await storage.createMockup({
        projectId,
        type: "3d",
        imageUrl: chapterImages[0] || "/placeholder-3d.jpg",
        metadata: { title: project.title, style },
      });

      await storage.createMockup({
        projectId,
        type: "mobile",
        imageUrl: chapterImages[1] || "/placeholder-mobile.jpg",
        metadata: { title: project.title, style },
      });

      await storage.createMockup({
        projectId,
        type: "desktop",
        imageUrl: chapterImages[2] || "/placeholder-desktop.jpg",
        metadata: { title: project.title, style },
      });
      
      await storage.updateProjectStatus(projectId, "completed", 100, "All chapters generated");
      console.log(`[Manual Project] ✓ Completed with exports and mockups!`);
    } else {
      const generatedCount = allInstructions.filter((inst: any) => inst.status === "generated").length;
      const progress = Math.round((generatedCount / allInstructions.length) * 100);
      await storage.updateProjectStatus(projectId, "generating", progress, `Generated ${generatedCount}/${allInstructions.length} chapters`);
    }
  } catch (error: any) {
    console.error("Manual chapter generation error:", error);
    await storage.updateChapterInstruction(chapterInstruction.id, { status: "failed" });
    throw error;
  }
}
