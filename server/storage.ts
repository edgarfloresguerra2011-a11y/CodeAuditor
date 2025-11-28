import { db } from "../db";
import { 
  users, 
  projects, 
  generationJobs,
  apiConfigs,
  chapters,
  chapterInstructions,
  mockups,
  exports,
  translations,
  insertProjectSchema,
  insertApiConfigSchema,
  insertChapterSchema,
  insertChapterInstructionSchema,
  insertMockupSchema,
  insertExportSchema,
  insertTranslationSchema,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type GenerationJob,
  type InsertGenerationJob,
  type ApiConfig,
  type InsertApiConfig,
  type Chapter,
  type InsertChapter,
  type ChapterInstruction,
  type InsertChapterInstruction,
  type Mockup,
  type InsertMockup,
  type Export,
  type InsertExport,
  type Translation,
  type InsertTranslation
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createApiConfig(data: InsertApiConfig): Promise<ApiConfig>;
  getApiConfigs(userId: string): Promise<ApiConfig[]>;
  updateApiConfig(id: number, data: Partial<InsertApiConfig>): Promise<ApiConfig | undefined>;
  deleteApiConfig(id: number): Promise<void>;
  
  createProject(data: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  updateProjectStatus(id: number, status: string, progress: number, currentStep?: string): Promise<void>;
  
  createGenerationJob(data: InsertGenerationJob): Promise<GenerationJob>;
  getGenerationJobsByProject(projectId: number): Promise<GenerationJob[]>;
  updateGenerationJob(id: number, status: string, result?: any, error?: string): Promise<void>;
  
  createChapter(data: InsertChapter): Promise<Chapter>;
  getChaptersByProject(projectId: number): Promise<Chapter[]>;
  
  createChapterInstruction(data: InsertChapterInstruction): Promise<ChapterInstruction>;
  getChapterInstructionsByProject(projectId: number): Promise<ChapterInstruction[]>;
  updateChapterInstruction(id: number, data: Partial<InsertChapterInstruction>): Promise<ChapterInstruction | undefined>;
  
  createMockup(data: InsertMockup): Promise<Mockup>;
  getMockupsByProject(projectId: number): Promise<Mockup[]>;
  
  createExport(data: InsertExport): Promise<Export>;
  getExportsByProject(projectId: number): Promise<Export[]>;
  getExportsByProjectAndLanguage(projectId: number, language: string): Promise<Export[]>;
  
  createTranslation(data: InsertTranslation): Promise<Translation>;
  getTranslationsByChapter(chapterId: number): Promise<Translation[]>;
  getTranslationsByProject(projectId: number): Promise<Translation[]>;
}

export class Storage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createApiConfig(data: InsertApiConfig): Promise<ApiConfig> {
    const validated = insertApiConfigSchema.parse(data);
    const [config] = await db.insert(apiConfigs).values(validated).returning();
    return config;
  }

  async getApiConfigs(userId: string): Promise<ApiConfig[]> {
    return await db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId)).orderBy(desc(apiConfigs.createdAt));
  }

  async updateApiConfig(id: number, data: Partial<InsertApiConfig>): Promise<ApiConfig | undefined> {
    const [updated] = await db
      .update(apiConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteApiConfig(id: number): Promise<void> {
    await db.delete(apiConfigs).where(eq(apiConfigs.id, id));
  }

  async createProject(data: InsertProject): Promise<Project> {
    const validated = insertProjectSchema.parse(data);
    const [project] = await db.insert(projects).values(validated).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async updateProjectStatus(id: number, status: string, progress: number, currentStep?: string): Promise<void> {
    await db
      .update(projects)
      .set({ 
        status, 
        generationProgress: progress, 
        currentStep,
        updatedAt: new Date() 
      })
      .where(eq(projects.id, id));
  }

  async createGenerationJob(data: InsertGenerationJob): Promise<GenerationJob> {
    const [job] = await db.insert(generationJobs).values(data).returning();
    return job;
  }

  async getGenerationJobsByProject(projectId: number): Promise<GenerationJob[]> {
    return await db.select().from(generationJobs).where(eq(generationJobs.projectId, projectId));
  }

  async updateGenerationJob(id: number, status: string, result?: any, error?: string): Promise<void> {
    await db
      .update(generationJobs)
      .set({ 
        status, 
        result, 
        error,
        completedAt: status === "completed" || status === "failed" ? new Date() : undefined
      })
      .where(eq(generationJobs.id, id));
  }

  async createChapter(data: InsertChapter): Promise<Chapter> {
    const validated = insertChapterSchema.parse(data);
    const [chapter] = await db.insert(chapters).values(validated).returning();
    return chapter;
  }

  async getChaptersByProject(projectId: number): Promise<Chapter[]> {
    return await db.select().from(chapters).where(eq(chapters.projectId, projectId)).orderBy(chapters.chapterNumber);
  }

  async createChapterInstruction(data: InsertChapterInstruction): Promise<ChapterInstruction> {
    const validated = insertChapterInstructionSchema.parse(data);
    const [instruction] = await db.insert(chapterInstructions).values(validated).returning();
    return instruction;
  }

  async getChapterInstructionsByProject(projectId: number): Promise<ChapterInstruction[]> {
    return await db.select().from(chapterInstructions).where(eq(chapterInstructions.projectId, projectId)).orderBy(chapterInstructions.chapterNumber);
  }

  async updateChapterInstruction(id: number, data: Partial<InsertChapterInstruction>): Promise<ChapterInstruction | undefined> {
    const [updated] = await db
      .update(chapterInstructions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chapterInstructions.id, id))
      .returning();
    return updated;
  }

  async createMockup(data: InsertMockup): Promise<Mockup> {
    const validated = insertMockupSchema.parse(data);
    const [mockup] = await db.insert(mockups).values(validated).returning();
    return mockup;
  }

  async getMockupsByProject(projectId: number): Promise<Mockup[]> {
    return await db.select().from(mockups).where(eq(mockups.projectId, projectId));
  }

  async createExport(data: InsertExport): Promise<Export> {
    const validated = insertExportSchema.parse(data);
    const [exp] = await db.insert(exports).values(validated).returning();
    return exp;
  }

  async getExportsByProject(projectId: number): Promise<Export[]> {
    return await db.select().from(exports).where(eq(exports.projectId, projectId));
  }

  async getExportsByProjectAndLanguage(projectId: number, language: string): Promise<Export[]> {
    return await db.select().from(exports).where(eq(exports.projectId, projectId) && eq(exports.language, language));
  }

  async createTranslation(data: InsertTranslation): Promise<Translation> {
    const validated = insertTranslationSchema.parse(data);
    const [translation] = await db.insert(translations).values(validated).returning();
    return translation;
  }

  async getTranslationsByChapter(chapterId: number): Promise<Translation[]> {
    return await db.select().from(translations).where(eq(translations.chapterId, chapterId));
  }

  async getTranslationsByProject(projectId: number): Promise<Translation[]> {
    return await db.select().from(translations).where(eq(translations.projectId, projectId));
  }
}

export const storage = new Storage();
