import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- USERS ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  role: text("role").default("user"),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createInsertSchema(users);

// --- PROJECTS ---
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createInsertSchema(projects);

// --- GENERATION JOBS ---
export const generationJobs = pgTable("generation_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGenerationJobSchema = createInsertSchema(generationJobs);
export const selectGenerationJobSchema = createInsertSchema(generationJobs);

// --- API CONFIGS ---
export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull(), // openai, google, etc
  apiKey: text("api_key").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs);
export const selectApiConfigSchema = createInsertSchema(apiConfigs);

// --- CHAPTERS ---
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  order: integer("order").notNull(),
});

export const insertChapterSchema = createInsertSchema(chapters);
export const selectChapterSchema = createInsertSchema(chapters);

// --- CHAPTER INSTRUCTIONS ---
export const chapterInstructions = pgTable("chapter_instructions", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull(),
  instruction: text("instruction").notNull(),
});

export const insertChapterInstructionSchema = createInsertSchema(chapterInstructions);
export const selectChapterInstructionSchema = createInsertSchema(chapterInstructions);

// --- MOCKUPS ---
export const mockups = pgTable("mockups", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
});

export const insertMockupSchema = createInsertSchema(mockups);
export const selectMockupSchema = createInsertSchema(mockups);

// --- EXPORTS (LO QUE FALTABA) ---
export const exports = pgTable("exports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  format: text("format").notNull(), // 'pdf', 'docx', etc
  status: text("status").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExportSchema = createInsertSchema(exports);
export const selectExportSchema = createInsertSchema(exports);

// --- TRANSLATIONS (LO QUE FALTABA) ---
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  targetLanguage: text("target_language").notNull(),
  status: text("status").notNull(),
  translatedContent: jsonb("translated_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translations);
export const selectTranslationSchema = createInsertSchema(translations);
