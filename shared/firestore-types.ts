import { z } from "zod";

// ==================== Firestore Schema ====================
// Structure:
// - users/{userId}
// - users/{userId}/apiConfigs/{configId}
// - projects/{projectId}
// - projects/{projectId}/chapters/{chapterId}
// - projects/{projectId}/exports/{exportId}
// - projects/{projectId}/mockups/{mockupId}
// - projects/{projectId}/generationJobs/{jobId}
// - projects/{projectId}/chapterInstructions/{instructionId}

// ==================== User ====================
export const userSchema = z.object({
  id: z.string(), // Firebase Auth UID
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FirestoreUser = z.infer<typeof userSchema>;

// ==================== API Config ====================
export const apiConfigSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: z.string(), // "text_generation", "image_generation", "translation"
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FirestoreApiConfig = z.infer<typeof apiConfigSchema>;

// ==================== Project ====================
export const projectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  style: z.string(),
  status: z.string().default("pending"), // "pending", "generating", "completed", "failed"
  mode: z.string().default("autopilot"), // "autopilot" or "manual"
  primaryLanguage: z.string().default("en"),
  targetLanguages: z.array(z.string()).default([]),
  
  generationProgress: z.number().default(0),
  currentStep: z.string().optional(),
  
  outline: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  
  content: z.record(z.unknown()).optional(),
  images: z.array(z.string()).default([]),
  
  files: z.record(z.unknown()).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FirestoreProject = z.infer<typeof projectSchema>;

// ==================== Chapter ====================
export const chapterSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  chapterNumber: z.number(),
  title: z.string(),
  htmlContent: z.string(),
  imageUrl: z.string().optional(),
  language: z.string().default("en"),
  createdAt: z.date(),
});

export type FirestoreChapter = z.infer<typeof chapterSchema>;

// ==================== Chapter Instruction ====================
export const chapterInstructionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  chapterNumber: z.number(),
  title: z.string(),
  instructions: z.string().optional(),
  status: z.string().default("draft"), // "draft", "generating", "generated"
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FirestoreChapterInstruction = z.infer<typeof chapterInstructionSchema>;

// ==================== Mockup ====================
export const mockupSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: z.string(), // "3d", "mobile", "desktop", "tablet_office", "book_3d", "multi_device"
  imageUrl: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type FirestoreMockup = z.infer<typeof mockupSchema>;

// ==================== Export ====================
export const exportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  format: z.string(), // "epub", "pdf", "zip"
  language: z.string().default("en"),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  createdAt: z.date(),
});

export type FirestoreExport = z.infer<typeof exportSchema>;

// ==================== Generation Job ====================
export const generationJobSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  step: z.string(),
  status: z.string().default("pending"),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type FirestoreGenerationJob = z.infer<typeof generationJobSchema>;

// ==================== Translation ====================
export const translationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  language: z.string(),
  chapterId: z.string(),
  translatedContent: z.string(),
  createdAt: z.date(),
});

export type FirestoreTranslation = z.infer<typeof translationSchema>;
