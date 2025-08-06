import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { isAdminWallet } from "../utils/wallet";
import { useAdminAuth } from "../hooks/useAdminAuth";
import AdminWalletConnection from "../components/admin/AdminWalletConnection";
import {
  Bot,
  Upload,
  FileText,
  Settings,
  MessageSquare,
  Trash2,
  Book,
  PenTool,
  File,
  FileEdit,
  Pencil,
  Trophy,
  BarChart,
  Award,
  Share2,
} from "lucide-react";
import { DocItem } from "../types/documentation";
import { documentationApi } from "../lib/api/documentation";
import ContestManagement from "../components/admin/ContestManagement";
import AnalyticsDashboard from "../components/admin/AnalyticsDashboard";
import RewardDistributionPanel from "../components/admin/RewardDistributionPanel";
import PlatformManagement from "../components/admin/PlatformManagement";
import WhiteLabelManagement from "../components/admin/WhiteLabelManagement";
import SocialAIManagement from "../components/admin/SocialAIManagement";

// Use the same constants as usePresale.ts
const TREASURY_WALLET = new PublicKey(
  "668N9L9tdjKwEW26Zg5gtMKVs5PA8x1Tp5FHeEZkj8i2"
);
const PRESALE_START = new Date("2025-01-01T09:00:00Z");
const PRESALE_END = new Date("2025-01-10T23:59:59Z");
const MIN_CONTRIBUTION = 0.1;
const MAX_CONTRIBUTION = 5;

// Helper functions for status
const getStatusText = () => {
  const now = new Date();
  if (now < PRESALE_START) return "Not Started";
  if (now > PRESALE_END) return "Ended";
  return "Active";
};

const getStatusColor = () => {
  const now = new Date();
  if (now < PRESALE_START) return "text-yellow-500";
  if (now > PRESALE_END) return "text-red-500";
  return "text-green-500";
};

// AI Chatbot API
const chatbotApi = {
  // Document operations
  uploadDocument: async (
    file: File
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/chatbot/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: response.ok ? data.message : data.error || "Upload failed",
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      return { success: false, message: "Error uploading document" };
    }
  },

  listDocuments: async (): Promise<string[]> => {
    try {
      const response = await fetch("/api/chatbot/api/documents");
      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error("Error listing documents:", error);
      return [];
    }
  },

  deleteDocument: async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chatbot/api/documents/${filename}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  },

  // Persona settings
  getPersonaSettings: async (): Promise<any> => {
    try {
      const response = await fetch("/api/chatbot/api/settings/persona");
      const data = await response.json();
      return data.persona || null;
    } catch (error) {
      console.error("Error fetching persona settings:", error);
      return null;
    }
  },

  savePersonaSettings: async (persona: any): Promise<boolean> => {
    try {
      const response = await fetch("/api/chatbot/api/settings/persona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ persona }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error saving persona settings:", error);
      return false;
    }
  },
};

const Admin = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Use new admin authentication hook
  const {
    isAdminAuthenticated,
    isAdminAuthorized,
    adminUser,
    isAuthenticating,
    authError,
  } = useAdminAuth();

  // Keep backward compatibility
  const isAuthorized = isAdminWallet(publicKey?.toBase58());

  // Admin tabs
  const [activeTab, setActiveTab] = useState<
    | "presale"
    | "chatbot"
    | "documents"
    | "contests"
    | "analytics"
    | "platforms"
    | "white-label"
    | "social-ai"
  >("presale");
  const [chatbotSubTab, setChatbotSubTab] = useState<"documents" | "persona">(
    "documents"
  );
  const [docSubTab, setDocSubTab] = useState<
    "edit" | "add-markdown" | "add-medium"
  >("edit");
  const [contestsSubTab, setContestsSubTab] = useState<"manage" | "rewards">(
    "manage"
  );

  // Chatbot admin states
  const [chatbotDocuments, setChatbotDocuments] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [persona, setPersona] = useState<{
    name: string;
    style: string;
    background: string;
  }>({
    name: "",
    style: "",
    background: "",
  });
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [personaSaveStatus, setPersonaSaveStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Document admin states
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [isLoadingWebsiteDocs, setIsLoadingWebsiteDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docSaveStatus, setDocSaveStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Document form states
  const [docFormState, setDocFormState] = useState({
    // Edit existing doc form
    edit: {
      title: "",
      description: "",
      icon: "",
      content: "",
      type: "markdown" as DocItem["type"],
    },
    // GitHub markdown doc form
    markdown: {
      title: "",
      description: "",
      content: "",
      icon: "",
      id: "",
    },
    // Medium article form
    medium: {
      title: "",
      description: "",
      url: "",
      category: "",
      readTime: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Fetch functions
  const fetchBalance = async () => {
    try {
      const bal = await connection.getBalance(TREASURY_WALLET);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    }
  };

  const fetchChatbotDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await chatbotApi.listDocuments();
      setChatbotDocuments(docs);
    } catch (error) {
      console.error("Error fetching chatbot documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchPersonaSettings = async () => {
    try {
      const personaData = await chatbotApi.getPersonaSettings();
      if (personaData) {
        setPersona(personaData);
      }
    } catch (error) {
      console.error("Error fetching persona settings:", error);
    }
  };

  const fetchWebsiteDocuments = async () => {
    setIsLoadingWebsiteDocs(true);
    try {
      const allDocs = await documentationApi.getAllDocs();
      setDocuments(allDocs);
    } catch (error) {
      console.error("Error fetching website documents:", error);
    } finally {
      setIsLoadingWebsiteDocs(false);
    }
  };

  // Document handlers
  const handleChatbotFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const file = files[0];
      const result = await chatbotApi.uploadDocument(file);

      setUploadStatus({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        fetchChatbotDocuments(); // Refresh document list
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus({
        success: false,
        message: "An unexpected error occurred during upload",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDeleteChatbotDocument = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        const success = await chatbotApi.deleteDocument(filename);
        if (success) {
          setChatbotDocuments(
            chatbotDocuments.filter((doc) => doc !== filename)
          );
        } else {
          alert("Failed to delete document");
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Error deleting document");
      }
    }
  };

  // Persona handlers
  const handlePersonaChange = (field: string, value: string) => {
    setPersona({ ...persona, [field]: value });
  };

  const handleSavePersona = async () => {
    setIsSavingPersona(true);
    setPersonaSaveStatus(null);

    try {
      const success = await chatbotApi.savePersonaSettings(persona);

      setPersonaSaveStatus({
        success,
        message: success
          ? "Persona settings saved successfully"
          : "Failed to save persona settings",
      });
    } catch (error) {
      console.error("Error saving persona:", error);
      setPersonaSaveStatus({
        success: false,
        message: "An unexpected error occurred while saving",
      });
    } finally {
      setIsSavingPersona(false);
    }
  };

  // Website document handlers
  const handleDocInputChange = (
    type: "edit" | "markdown" | "medium",
    field: string,
    value: string
  ) => {
    setDocFormState((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  // Load a document into the edit form
  const loadDocForEditing = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setSelectedDocId(docId);
    setIsEditingDoc(true);

    setDocFormState((prev) => ({
      ...prev,
      edit: {
        title: doc.title || "",
        description: doc.description || "",
        icon: doc.icon || "",
        content: doc.content || "",
        type: doc.type,
      },
    }));
  };

  // Handle edit form submission
  const handleEditDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDocId) return;
    setDocSaveStatus(null);

    try {
      // In a real app, this would update the document in the database
      // For this demo, we'll just update it in memory

      // Update the document in state
      const updatedDocs = documents.map((doc) => {
        if (doc.id === selectedDocId) {
          return {
            ...doc,
            title: docFormState.edit.title,
            description: docFormState.edit.description,
            icon: docFormState.edit.icon,
            content: docFormState.edit.content,
          };
        }
        return doc;
      });

      setDocuments(updatedDocs);

      setDocSaveStatus({
        success: true,
        message: "Document updated successfully",
      });

      // In a production app, we would call an API here
      console.log("Document updated:", {
        id: selectedDocId,
        ...docFormState.edit,
      });

      // Reset editing state
      setTimeout(() => {
        setIsEditingDoc(false);
        setSelectedDocId(null);
      }, 1500);
    } catch (error) {
      console.error("Error updating document:", error);
      setDocSaveStatus({
        success: false,
        message: "Error updating document",
      });
    }
  };

  // Handle markdown doc submission
  const handleMarkdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocSaveStatus(null);

    try {
      const success = await documentationApi.addMarkdownDocument({
        title: docFormState.markdown.title,
        description: docFormState.markdown.description,
        content: docFormState.markdown.content,
        icon: docFormState.markdown.icon,
        id: docFormState.markdown.id,
      });

      if (success) {
        setDocSaveStatus({
          success: true,
          message: "Markdown document added successfully",
        });

        // Reset form
        setDocFormState((prev) => ({
          ...prev,
          markdown: {
            title: "",
            description: "",
            content: "",
            icon: "",
            id: "",
          },
        }));

        // Refresh documents
        fetchWebsiteDocuments();
      } else {
        setDocSaveStatus({
          success: false,
          message: "Failed to add markdown document",
        });
      }
    } catch (error) {
      console.error("Error adding markdown document:", error);
      setDocSaveStatus({
        success: false,
        message: "An error occurred while adding document",
      });
    }
  };

  // Handle medium article submission
  const handleMediumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocSaveStatus(null);

    try {
      const success = await documentationApi.addMediumArticle({
        title: docFormState.medium.title,
        description: docFormState.medium.description,
        url: docFormState.medium.url,
        category: docFormState.medium.category,
        readTime: docFormState.medium.readTime,
        date: docFormState.medium.date,
      });

      if (success) {
        setDocSaveStatus({
          success: true,
          message: "Medium article added successfully",
        });

        // Reset form
        setDocFormState((prev) => ({
          ...prev,
          medium: {
            title: "",
            description: "",
            url: "",
            category: "",
            readTime: "",
            date: new Date().toISOString().split("T")[0],
          },
        }));

        // Refresh documents
        fetchWebsiteDocuments();
      } else {
        setDocSaveStatus({
          success: false,
          message: "Failed to add Medium article",
        });
      }
    } catch (error) {
      console.error("Error adding Medium article:", error);
      setDocSaveStatus({
        success: false,
        message: "An error occurred while adding article",
      });
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (connected && (isAdminAuthenticated || isAuthorized)) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [connected, isAdminAuthenticated, isAuthorized]);

  // Load chatbot data when tabs change
  useEffect(() => {
    if (
      connected &&
      (isAdminAuthenticated || isAuthorized) &&
      activeTab === "chatbot"
    ) {
      if (chatbotSubTab === "documents") {
        fetchChatbotDocuments();
      } else if (chatbotSubTab === "persona") {
        fetchPersonaSettings();
      }
    }
  }, [connected, isAdminAuthenticated, isAuthorized, activeTab, chatbotSubTab]);

  // Load website documents when document tab is active
  useEffect(() => {
    if (
      connected &&
      (isAdminAuthenticated || isAuthorized) &&
      activeTab === "documents"
    ) {
      fetchWebsiteDocuments();
    }
  }, [connected, isAdminAuthenticated, isAuthorized, activeTab]);

  // Show admin wallet connection interface if not authenticated
  if (!connected || (!isAdminAuthenticated && !isAuthorized)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
          Admin Access
        </h1>

        <AdminWalletConnection
          onAuthenticationSuccess={() => {
            console.log("Admin authentication successful");
            // Optionally refresh data or show success message
          }}
          onAuthenticationFailure={(error) => {
            console.error("Admin authentication failed:", error);
            // Optionally show error message
          }}
          showConfig={true}
        />

        {/* Show legacy unauthorized message for backward compatibility */}
        {connected && !isAdminAuthorized && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="text-xl text-red-400">
              <p>Wallet not authorized for admin access</p>
              {publicKey && (
                <p className="text-sm mt-2 text-gray-400">
                  Connected Wallet: {publicKey.toBase58().slice(0, 8)}...
                  {publicKey.toBase58().slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
        Admin Dashboard
      </h1>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-gray-700 mb-8 overflow-x-auto">
        <button
          className={`py-3 px-6 font-medium text-sm ${
            activeTab === "presale"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("presale")}
        >
          Presale Admin
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "contests"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("contests")}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Contests
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "analytics"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart className="w-4 h-4 mr-2" />
          Analytics
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "chatbot"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("chatbot")}
        >
          <Bot className="w-4 h-4 mr-2" />
          Chatbot Admin
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "documents"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("documents")}
        >
          <Book className="w-4 h-4 mr-2" />
          Documents Admin
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "platforms"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("platforms")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Platforms
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "white-label"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("white-label")}
        >
          <Award className="w-4 h-4 mr-2" />
          White Label
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm flex items-center ${
            activeTab === "social-ai"
              ? "text-soless-blue border-b-2 border-soless-blue"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("social-ai")}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Social AI
        </button>
      </div>

      {activeTab === "presale" && (
        <div>
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h3 className="text-lg font-semibold text-soless-blue mb-2">
                Total Raised
              </h3>
              <p className="text-2xl font-bold">
                {balance !== null ? balance.toFixed(2) : "Loading..."} SOL
              </p>
            </div>
          </div>

          {/* Presale Settings */}
          <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-soless-blue">
              Presale Settings
            </h2>
            <ul className="text-gray-300 space-y-2">
              <li>Start time: {PRESALE_START.toUTCString()}</li>
              <li>End time: {PRESALE_END.toUTCString()}</li>
              <li>Minimum contribution: {MIN_CONTRIBUTION} SOL</li>
              <li>Maximum contribution: {MAX_CONTRIBUTION} SOL</li>
              <li>Treasury wallet: {TREASURY_WALLET.toString()}</li>
            </ul>
          </div>

          {/* Presale Status */}
          <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40">
            <h2 className="text-2xl font-bold mb-4 text-soless-blue">
              Presale Status
            </h2>
            <div className="text-gray-300">
              <p>
                Status:{" "}
                <span className={getStatusColor()}>{getStatusText()}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chatbot" && (
        <div>
          {/* Chatbot Admin Sub-Navigation */}
          <div className="flex mb-6 bg-black/20 rounded-md">
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                chatbotSubTab === "documents"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setChatbotSubTab("documents")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </button>
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                chatbotSubTab === "persona"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setChatbotSubTab("persona")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Persona Settings
            </button>
          </div>

          {/* Document Management */}
          {chatbotSubTab === "documents" && (
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h2 className="text-xl font-bold mb-4 text-soless-blue flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Knowledge Base Documents
              </h2>

              {/* Upload section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-2">
                  Upload Document
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Upload PDF, Markdown, or TXT files that will be used as
                  knowledge for the chatbot.
                </p>

                <div className="flex items-center">
                  <label className="flex items-center bg-soless-blue/20 hover:bg-soless-blue/30 text-white py-2 px-4 rounded cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Select File"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.md,.txt"
                      onChange={handleChatbotFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <span className="ml-4 text-gray-400 text-sm">
                    Supported: .pdf, .md, .txt (Max 10MB)
                  </span>
                </div>

                {uploadStatus && (
                  <div
                    className={`mt-3 text-sm ${
                      uploadStatus.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {uploadStatus.message}
                  </div>
                )}
              </div>

              {/* Document list */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Current Documents
                </h3>
                {isLoadingDocuments ? (
                  <div className="text-gray-400">Loading documents...</div>
                ) : chatbotDocuments.length === 0 ? (
                  <div className="text-gray-400">No documents uploaded</div>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {chatbotDocuments.map((doc) => (
                      <li
                        key={doc}
                        className="py-3 flex justify-between items-center"
                      >
                        <span className="text-gray-300">{doc}</span>
                        <button
                          onClick={() => handleDeleteChatbotDocument(doc)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Persona Settings */}
          {chatbotSubTab === "persona" && (
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h2 className="text-xl font-bold mb-4 text-soless-blue flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chatbot Persona Settings
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) =>
                      handlePersonaChange("name", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    placeholder="e.g., SOLess Guide"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">
                    Communication Style
                  </label>
                  <textarea
                    value={persona.style}
                    onChange={(e) =>
                      handlePersonaChange("style", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2 h-24"
                    placeholder="e.g., Helpful, knowledgeable, technically accurate but approachable"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Background</label>
                  <textarea
                    value={persona.background}
                    onChange={(e) =>
                      handlePersonaChange("background", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2 h-24"
                    placeholder="e.g., Technical expert on the SOLess project and Solana ecosystem"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona}
                  className={`${
                    isSavingPersona
                      ? "bg-soless-blue/50"
                      : "bg-soless-blue hover:bg-soless-blue/80"
                  } text-white py-2 px-4 rounded flex items-center`}
                >
                  {isSavingPersona ? "Saving..." : "Save Persona Settings"}
                </button>

                {personaSaveStatus && (
                  <span
                    className={`ml-4 text-sm ${
                      personaSaveStatus.success
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {personaSaveStatus.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contests Tab */}
      {activeTab === "contests" && (
        <div>
          <div className="flex mb-6 bg-black/20 rounded-md">
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                contestsSubTab === "manage"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setContestsSubTab("manage")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Contest Management
            </button>
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                contestsSubTab === "rewards"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setContestsSubTab("rewards")}
            >
              <Award className="w-4 h-4 mr-2" />
              Reward Distribution
            </button>
          </div>

          {contestsSubTab === "manage" && <ContestManagement />}
          {contestsSubTab === "rewards" && <RewardDistributionPanel />}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <AnalyticsDashboard />
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === "platforms" && (
        <div>
          <PlatformManagement />
        </div>
      )}

      {/* White Label Tab */}
      {activeTab === "white-label" && (
        <div>
          <WhiteLabelManagement />
        </div>
      )}

      {/* Social AI Tab */}
      {activeTab === "social-ai" && (
        <div>
          <SocialAIManagement />
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div>
          {/* Document Admin Sub-Navigation */}
          <div className="flex mb-6 bg-black/20 rounded-md">
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                docSubTab === "edit"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDocSubTab("edit")}
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Edit Documents
            </button>
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                docSubTab === "add-markdown"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDocSubTab("add-markdown")}
            >
              <PenTool className="w-4 h-4 mr-2" />
              Add Markdown
            </button>
            <button
              className={`py-2 px-4 rounded-md flex items-center ${
                docSubTab === "add-medium"
                  ? "bg-soless-blue/20 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDocSubTab("add-medium")}
            >
              <File className="w-4 h-4 mr-2" />
              Add Medium
            </button>
          </div>

          {/* Edit Documents */}
          {docSubTab === "edit" && (
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h2 className="text-xl font-bold mb-4 text-soless-blue flex items-center">
                <FileEdit className="w-5 h-5 mr-2" />
                Edit Existing Documents
              </h2>

              {isLoadingWebsiteDocs ? (
                <div className="text-gray-400">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-gray-400">No documents found</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-black/50 p-4 rounded border border-gray-700 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium text-white">
                            {doc.title}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {doc.description}
                          </p>
                          <span className="text-xs text-gray-500 capitalize">
                            {doc.type}
                          </span>
                        </div>
                        <button
                          onClick={() => loadDocForEditing(doc.id)}
                          className="bg-soless-blue hover:bg-soless-blue/80 text-white py-2 px-4 rounded"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>

                  {isEditingDoc && selectedDocId && (
                    <div className="mt-8 bg-black/50 p-6 rounded border border-gray-700">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Edit Document
                      </h3>
                      <form
                        onSubmit={handleEditDocSubmit}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={docFormState.edit.title}
                            onChange={(e) =>
                              handleDocInputChange(
                                "edit",
                                "title",
                                e.target.value
                              )
                            }
                            className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={docFormState.edit.description}
                            onChange={(e) =>
                              handleDocInputChange(
                                "edit",
                                "description",
                                e.target.value
                              )
                            }
                            className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">
                            Icon
                          </label>
                          <input
                            type="text"
                            value={docFormState.edit.icon}
                            onChange={(e) =>
                              handleDocInputChange(
                                "edit",
                                "icon",
                                e.target.value
                              )
                            }
                            className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                            placeholder="URL to icon image"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">
                            Content
                          </label>
                          <textarea
                            value={docFormState.edit.content}
                            onChange={(e) =>
                              handleDocInputChange(
                                "edit",
                                "content",
                                e.target.value
                              )
                            }
                            className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2 h-32"
                            placeholder="Document content..."
                            required
                          />
                        </div>

                        <div className="flex items-center">
                          <button
                            type="submit"
                            className="bg-soless-blue hover:bg-soless-blue/80 text-white py-2 px-4 rounded mr-4"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingDoc(false);
                              setSelectedDocId(null);
                            }}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
                          >
                            Cancel
                          </button>

                          {docSaveStatus && (
                            <span
                              className={`ml-4 text-sm ${
                                docSaveStatus.success
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {docSaveStatus.message}
                            </span>
                          )}
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add Markdown Document */}
          {docSubTab === "add-markdown" && (
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h2 className="text-xl font-bold mb-4 text-soless-blue flex items-center">
                <PenTool className="w-5 h-5 mr-2" />
                Add Markdown Document
              </h2>
              <form onSubmit={handleMarkdownSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={docFormState.markdown.title}
                    onChange={(e) =>
                      handleDocInputChange("markdown", "title", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={docFormState.markdown.description}
                    onChange={(e) =>
                      handleDocInputChange(
                        "markdown",
                        "description",
                        e.target.value
                      )
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Icon URL</label>
                  <input
                    type="url"
                    value={docFormState.markdown.icon}
                    onChange={(e) =>
                      handleDocInputChange("markdown", "icon", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Markdown Content
                  </label>
                  <textarea
                    value={docFormState.markdown.content}
                    onChange={(e) =>
                      handleDocInputChange(
                        "markdown",
                        "content",
                        e.target.value
                      )
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2 h-64 font-mono"
                    placeholder="Enter your markdown content here..."
                    required
                  />
                </div>

                <div className="flex items-center">
                  <button
                    type="submit"
                    className="bg-soless-blue hover:bg-soless-blue/80 text-white py-2 px-4 rounded"
                  >
                    Add Document
                  </button>

                  {docSaveStatus && (
                    <span
                      className={`ml-4 text-sm ${
                        docSaveStatus.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {docSaveStatus.message}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Add Medium Article */}
          {docSubTab === "add-medium" && (
            <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
              <h2 className="text-xl font-bold mb-4 text-soless-blue flex items-center">
                <File className="w-5 h-5 mr-2" />
                Add Medium Article
              </h2>
              <form onSubmit={handleMediumSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={docFormState.medium.title}
                    onChange={(e) =>
                      handleDocInputChange("medium", "title", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={docFormState.medium.description}
                    onChange={(e) =>
                      handleDocInputChange(
                        "medium",
                        "description",
                        e.target.value
                      )
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Medium Article URL
                  </label>
                  <input
                    type="url"
                    value={docFormState.medium.url}
                    onChange={(e) =>
                      handleDocInputChange("medium", "url", e.target.value)
                    }
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                    placeholder="https://medium.com/@username/article-title"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Category</label>
                    <input
                      type="text"
                      value={docFormState.medium.category}
                      onChange={(e) =>
                        handleDocInputChange(
                          "medium",
                          "category",
                          e.target.value
                        )
                      }
                      className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                      placeholder="Technology"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={docFormState.medium.readTime}
                      onChange={(e) =>
                        handleDocInputChange(
                          "medium",
                          "readTime",
                          e.target.value
                        )
                      }
                      className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                      placeholder="5 min read"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={docFormState.medium.date}
                      onChange={(e) =>
                        handleDocInputChange("medium", "date", e.target.value)
                      }
                      className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    type="submit"
                    className="bg-soless-blue hover:bg-soless-blue/80 text-white py-2 px-4 rounded"
                  >
                    Add Article
                  </button>

                  {docSaveStatus && (
                    <span
                      className={`ml-4 text-sm ${
                        docSaveStatus.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {docSaveStatus.message}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
