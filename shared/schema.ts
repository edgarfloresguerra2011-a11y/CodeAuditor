import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Firebase UID
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// API Configurations table - stores user's custom APIs
export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  apiKey: text("api_key").notNull(),
  baseUrl: text("base_url"),
  model: text("model"),
  metadata: jsonb("metadata"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
export type ApiConfig = typeof apiConfigs.$inferSelect;

// Projects table - stores each generated ebook project
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  style: text("style").notNull(),
  status: text("status").notNull().default("pending"),
  mode: text("mode").notNull().default("autopilot"), // "autopilot" or "manual"
  primaryLanguage: text("primary_language").notNull().default("en"),
  targetLanguages: text("target_languages").array().notNull().default(sql`ARRAY[]::text[]`),
  
  generationProgress: integer("generation_progress").notNull().default(0),
  currentStep: text("current_step"),
  
  outline: jsonb("outline"),
  content: jsonb("content"),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  
  files: jsonb("files"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Generation jobs table
export const generationJobs = pgTable("generation_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  step: text("step").notNull(),
  status: text("status").notNull().default("pending"),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGenerationJobSchema = createInsertSchema(generationJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertGenerationJob = z.infer<typeof insertGenerationJobSchema>;
export type GenerationJob = typeof generationJobs.$inferSelect;

// Chapters table - stores each chapter of the ebook
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  htmlContent: text("html_content").notNull(),
  imageUrl: text("image_url"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
});

export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chapters.$inferSelect;

// Chapter Instructions table - stores user instructions for manual chapter generation
export const chapterInstructions = pgTable("chapter_instructions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  instructions: text("instructions"),
  status: text("status").notNull().default("draft"), // "draft", "generated", "published"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChapterInstructionSchema = createInsertSchema(chapterInstructions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChapterInstruction = z.infer<typeof insertChapterInstructionSchema>;
export type ChapterInstruction = typeof chapterInstructions.$inferSelect;

// Mockups table - stores 3D book mockups and mobile/desktop previews
export const mockups = pgTable("mockups", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(), // "3d", "mobile", "desktop", "spread"
  imageUrl: text("image_url").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMockupSchema = createInsertSchema(mockups).omit({
  id: true,
  createdAt: true,
});

export type InsertMockup = z.infer<typeof insertMockupSchema>;
export type Mockup = typeof mockups.$inferSelect;

// Exports table - stores download links for EPUB, PDF, ZIP
export const exports = pgTable("exports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  format: text("format").notNull(), // "epub", "pdf", "zip"
  language: text("language").notNull().default("en"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExportSchema = createInsertSchema(exports).omit({
  id: true,
  createdAt: true,
});

export type InsertExport = z.infer<typeof insertExportSchema>;
export type Export = typeof exports.$inferSelect;

// Translations table - stores translated chapters
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  language: text("language").notNull(),
  chapterId: integer("chapter_id").notNull().references(() => chapters.id),
  translatedContent: text("translated_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
