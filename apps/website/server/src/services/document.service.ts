import { PrismaClient, Document as PrismaDocument } from "@prisma/client";
import { logger } from "../utils/logger";
import {
  DocumentBase,
  DocumentType,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from "../routes/documents/types";

const prisma = new PrismaClient();

export interface CreateDocumentDTO {
  type: "MARKDOWN" | "PDF" | "EXTERNAL";
  title: string;
  description: string;
  content?: string;
  icon?: string;
  date: string;
}

export interface UpdateDocumentDTO {
  title?: string;
  description?: string;
  content?: string;
  icon?: string;
  date?: string;
}

/**
 * Service for managing documents
 */
export class DocumentService {
  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<PrismaDocument[]> {
    try {
      return await prisma.document.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error fetching documents:", error);
      throw new Error("Failed to fetch documents");
    }
  }

  /**
   * Get a document by id
   */
  async getDocumentById(id: string): Promise<PrismaDocument | null> {
    try {
      return await prisma.document.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error fetching document ${id}:`, error);
      throw new Error("Failed to fetch document");
    }
  }

  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentDTO): Promise<PrismaDocument> {
    try {
      return await prisma.document.create({
        data,
      });
    } catch (error) {
      logger.error("Error creating document:", error);
      throw new Error("Failed to create document");
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    id: string,
    data: UpdateDocumentDTO
  ): Promise<PrismaDocument> {
    try {
      return await prisma.document.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error(`Error updating document ${id}:`, error);
      throw new Error("Failed to update document");
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<PrismaDocument> {
    try {
      return await prisma.document.delete({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error deleting document ${id}:`, error);
      throw new Error("Failed to delete document");
    }
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(type: DocumentType): Promise<PrismaDocument[]> {
    try {
      return await prisma.document.findMany({
        where: { type },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(`Error fetching documents of type ${type}:`, error);
      throw new Error("Failed to fetch documents by type");
    }
  }

  /**
   * Search for documents
   */
  async searchDocuments(query: string): Promise<PrismaDocument[]> {
    try {
      return await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(`Error searching documents with query "${query}":`, error);
      throw new Error("Failed to search documents");
    }
  }
}

export const documentService = new DocumentService();
