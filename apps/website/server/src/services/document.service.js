"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Service for managing documents
 */
class DocumentService {
    /**
     * Get all documents
     */
    async getAllDocuments() {
        try {
            return await prisma.document.findMany({
                orderBy: { createdAt: "desc" },
            });
        }
        catch (error) {
            logger_1.logger.error("Error fetching documents:", error);
            throw new Error("Failed to fetch documents");
        }
    }
    /**
     * Get a document by id
     */
    async getDocumentById(id) {
        try {
            return await prisma.document.findUnique({
                where: { id },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error fetching document ${id}:`, error);
            throw new Error("Failed to fetch document");
        }
    }
    /**
     * Create a new document
     */
    async createDocument(data) {
        try {
            return await prisma.document.create({
                data,
            });
        }
        catch (error) {
            logger_1.logger.error("Error creating document:", error);
            throw new Error("Failed to create document");
        }
    }
    /**
     * Update an existing document
     */
    async updateDocument(id, data) {
        try {
            return await prisma.document.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error updating document ${id}:`, error);
            throw new Error("Failed to update document");
        }
    }
    /**
     * Delete a document
     */
    async deleteDocument(id) {
        try {
            return await prisma.document.delete({
                where: { id },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting document ${id}:`, error);
            throw new Error("Failed to delete document");
        }
    }
    /**
     * Get documents by type
     */
    async getDocumentsByType(type) {
        try {
            return await prisma.document.findMany({
                where: { type },
                orderBy: { createdAt: "desc" },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error fetching documents of type ${type}:`, error);
            throw new Error("Failed to fetch documents by type");
        }
    }
    /**
     * Search for documents
     */
    async searchDocuments(query) {
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
        }
        catch (error) {
            logger_1.logger.error(`Error searching documents with query "${query}":`, error);
            throw new Error("Failed to search documents");
        }
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();
