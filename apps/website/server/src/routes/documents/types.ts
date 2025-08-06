// Document types for the API

export type DocumentType = 'MARKDOWN' | 'PDF' | 'EXTERNAL';

export interface DocumentBase {
  id: string;
  type: DocumentType;
  title: string;
  description: string;
  content?: string;
  icon?: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentRequest {
  type: 'MARKDOWN' | 'PDF' | 'EXTERNAL';
  title: string;
  description: string;
  content?: string;
  icon?: string;
  date: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  content?: string;
  icon?: string;
  date?: string;
}

export interface DocumentResponse extends DocumentBase {}

export interface DocumentsResponse {
  documents: DocumentBase[];
}

export interface ErrorResponse {
  error: string;
}
