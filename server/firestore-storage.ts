import { getFirebaseAdmin } from "./firebase-admin";
import type {
  FirestoreUser,
  FirestoreProject,
  FirestoreChapter,
  FirestoreChapterInstruction,
  FirestoreMockup,
  FirestoreExport,
  FirestoreGenerationJob,
  FirestoreApiConfig,
} from "../shared/firestore-types";

// Lazy initialization - db is only initialized when needed
let db: any = null;

function getDb() {
  if (!db) {
    const { db: database } = getFirebaseAdmin();
    db = database;
  }
  return db;
}

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
}

// Helper to convert document snapshot to object with ID
function docToData<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: timestampToDate(data?.createdAt),
    updatedAt: timestampToDate(data?.updatedAt),
  } as T;
}

export class FirestoreStorage {
  // ==================== Users ====================
  async createUser(userId: string, email: string, displayName?: string, photoURL?: string) {
    const userRef = getDb().collection("users").doc(userId);
    const userData: Partial<FirestoreUser> = {
      id: userId,
      email,
      displayName,
      photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await userRef.set(userData);
    return userData as FirestoreUser;
  }

  async getUser(userId: string) {
    const doc = await getDb().collection("users").doc(userId).get();
    return docToData<FirestoreUser>(doc);
  }

  // ==================== Projects ====================
  async createProject(data: {
    userId: string;
    title: string;
    style: string;
    mode?: string;
    primaryLanguage?: string;
    targetLanguages?: string[];
  }): Promise<FirestoreProject> {
    const projectRef = getDb().collection("projects").doc();
    const projectData: Partial<FirestoreProject> = {
      id: projectRef.id,
      userId: data.userId,
      title: data.title,
      style: data.style,
      status: "pending",
      mode: data.mode || "autopilot",
      primaryLanguage: data.primaryLanguage || "en",
      targetLanguages: data.targetLanguages || [],
      generationProgress: 0,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await projectRef.set(projectData);
    return projectData as FirestoreProject;
  }

  async getProject(projectId: string) {
    const doc = await getDb().collection("projects").doc(projectId).get();
    return docToData<FirestoreProject>(doc);
  }

  async getProjectsByUser(userId: string) {
    const snapshot = await db
      .collection("projects")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreProject>(doc)!);
  }

  async updateProject(projectId: string, data: Partial<FirestoreProject>) {
    await getDb().collection("projects").doc(projectId).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async updateProjectStatus(projectId: string, status: string, progress: number, currentStep?: string) {
    await getDb().collection("projects").doc(projectId).update({
      status,
      generationProgress: progress,
      currentStep: currentStep || null,
      updatedAt: new Date(),
    });
  }

  // ==================== Chapters ====================
  async createChapter(data: {
    projectId: string;
    chapterNumber: number;
    title: string;
    htmlContent: string;
    imageUrl?: string;
    language?: string;
  }): Promise<FirestoreChapter> {
    const chapterRef = getDb().collection("projects").doc(data.projectId).collection("chapters").doc();
    const chapterData: Partial<FirestoreChapter> = {
      id: chapterRef.id,
      projectId: data.projectId,
      chapterNumber: data.chapterNumber,
      title: data.title,
      htmlContent: data.htmlContent,
      imageUrl: data.imageUrl,
      language: data.language || "en",
      createdAt: new Date(),
    };
    await chapterRef.set(chapterData);
    return chapterData as FirestoreChapter;
  }

  async getChaptersByProject(projectId: string, language?: string) {
    let query = db
      .collection("projects")
      .doc(projectId)
      .collection("chapters")
      .orderBy("chapterNumber", "asc");

    if (language) {
      query = query.where("language", "==", language) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreChapter>(doc)!);
  }

  // ==================== Chapter Instructions ====================
  async createChapterInstruction(data: {
    projectId: string;
    chapterNumber: number;
    title: string;
    instructions?: string;
  }): Promise<FirestoreChapterInstruction> {
    const instructionRef = db
      .collection("projects")
      .doc(data.projectId)
      .collection("chapterInstructions")
      .doc();
    
    const instructionData: Partial<FirestoreChapterInstruction> = {
      id: instructionRef.id,
      projectId: data.projectId,
      chapterNumber: data.chapterNumber,
      title: data.title,
      instructions: data.instructions,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await instructionRef.set(instructionData);
    return instructionData as FirestoreChapterInstruction;
  }

  async getChapterInstructionsByProject(projectId: string) {
    const snapshot = await db
      .collection("projects")
      .doc(projectId)
      .collection("chapterInstructions")
      .orderBy("chapterNumber", "asc")
      .get();
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreChapterInstruction>(doc)!);
  }

  async updateChapterInstruction(projectId: string, instructionId: string, data: Partial<FirestoreChapterInstruction>) {
    await db
      .collection("projects")
      .doc(projectId)
      .collection("chapterInstructions")
      .doc(instructionId)
      .update({
        ...data,
        updatedAt: new Date(),
      });
  }

  // ==================== Mockups ====================
  async createMockup(data: {
    projectId: string;
    type: string;
    imageUrl: string;
    metadata?: Record<string, any>;
  }): Promise<FirestoreMockup> {
    const mockupRef = getDb().collection("projects").doc(data.projectId).collection("mockups").doc();
    const mockupData: Partial<FirestoreMockup> = {
      id: mockupRef.id,
      projectId: data.projectId,
      type: data.type,
      imageUrl: data.imageUrl,
      metadata: data.metadata,
      createdAt: new Date(),
    };
    await mockupRef.set(mockupData);
    return mockupData as FirestoreMockup;
  }

  async getMockupsByProject(projectId: string) {
    const snapshot = await db
      .collection("projects")
      .doc(projectId)
      .collection("mockups")
      .get();
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreMockup>(doc)!);
  }

  // ==================== Exports ====================
  async createExport(data: {
    projectId: string;
    format: string;
    language: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
  }): Promise<FirestoreExport> {
    const exportRef = getDb().collection("projects").doc(data.projectId).collection("exports").doc();
    const exportData: Partial<FirestoreExport> = {
      id: exportRef.id,
      projectId: data.projectId,
      format: data.format,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      createdAt: new Date(),
    };
    await exportRef.set(exportData);
    return exportData as FirestoreExport;
  }

  async getExportsByProject(projectId: string) {
    const snapshot = await db
      .collection("projects")
      .doc(projectId)
      .collection("exports")
      .get();
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreExport>(doc)!);
  }

  // ==================== API Configs ====================
  async createApiConfig(data: {
    userId: string;
    name: string;
    type: string;
    apiKey: string;
    baseUrl?: string;
    model?: string;
    metadata?: Record<string, any>;
  }): Promise<FirestoreApiConfig> {
    const configRef = getDb().collection("users").doc(data.userId).collection("apiConfigs").doc();
    const configData: Partial<FirestoreApiConfig> = {
      id: configRef.id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl,
      model: data.model,
      metadata: data.metadata,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await configRef.set(configData);
    return configData as FirestoreApiConfig;
  }

  async getApiConfigsByUser(userId: string, type?: string) {
    let query = getDb().collection("users").doc(userId).collection("apiConfigs");

    if (type) {
      query = query.where("type", "==", type) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => docToData<FirestoreApiConfig>(doc)!);
  }

  async getActiveApiConfig(userId: string, type: string) {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("apiConfigs")
      .where("type", "==", type)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return docToData<FirestoreApiConfig>(snapshot.docs[0]);
  }

  // ==================== Generation Jobs ====================
  async createGenerationJob(data: {
    projectId: string;
    step: string;
    status?: string;
  }): Promise<FirestoreGenerationJob> {
    const jobRef = getDb().collection("projects").doc(data.projectId).collection("generationJobs").doc();
    const jobData: Partial<FirestoreGenerationJob> = {
      id: jobRef.id,
      projectId: data.projectId,
      step: data.step,
      status: data.status || "pending",
      createdAt: new Date(),
    };
    await jobRef.set(jobData);
    return jobData as FirestoreGenerationJob;
  }

  async updateGenerationJob(projectId: string, jobId: string, data: Partial<FirestoreGenerationJob>) {
    await db
      .collection("projects")
      .doc(projectId)
      .collection("generationJobs")
      .doc(jobId)
      .update(data);
  }
}

export const firestoreStorage = new FirestoreStorage();
