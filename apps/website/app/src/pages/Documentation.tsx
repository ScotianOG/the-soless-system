import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Newspaper,
  FileText,
  Globe,
  Github,
  PenTool,
  File,
  Lock,
  Shield,
  Coins,
} from "lucide-react";
import { DocItem } from "../types/documentation";
import { documentationApi } from "../lib/api/documentation";

// Local document type used in the UI
interface DocumentItem {
  title: string;
  description: string;
  date: string;
  link?: string;
  url?: string;
  version?: string;
  category?: string;
  readTime?: string;
}

interface DocSectionProps {
  title: string;
  items: DocumentItem[];
  icon: React.ComponentType<any>;
}

const Documentation = () => {
  const [markdownDocs, setMarkdownDocs] = useState<DocItem[]>([]);
  const [mediumArticles, setMediumArticles] = useState<DocItem[]>([]);
  const [whitepapers, setWhitepapers] = useState<DocItem[]>([]);
  const [articles, setArticles] = useState<DocItem[]>([]);
  const [press, setPress] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        // Get all docs from the API
        const allDocs = await documentationApi.getAllDocs();

        // Group docs by type
        const markdown = allDocs.filter((doc) => doc.type === "markdown");
        const medium = allDocs.filter(
          (doc) => doc.type === "external" && doc.icon === "globe"
        );

        // Process PDF docs
        const papers = allDocs
          .filter(
            (doc) => doc.type === "pdf" && doc.content?.includes("whitepaper")
          )
          .map((doc) => ({
            ...doc,
            // Make sure content field is a valid URL for PDF files
            content: doc.content?.startsWith("/")
              ? doc.content
              : `/${doc.content}`,
          }));

        const articleDocs = allDocs.filter(
          (doc) => doc.type === "pdf" && doc.content?.includes("article")
        );
        const pressDocs = allDocs.filter(
          (doc) => doc.type === "pdf" && doc.content?.includes("press")
        );

        // Special handling for technical document
        const technicalDoc = markdown.find((doc) => doc.id === "technical");
        if (technicalDoc) {
          technicalDoc.title = "Technical Architecture";
          technicalDoc.icon = "shield";
          technicalDoc.description =
            "Our verification system implements a sophisticated multi-layer approach with unique hash generation, media content on IPFS/Arweave, on-chain text verification, and smart contract validation.";
        }

        // Update state
        setMarkdownDocs(markdown);
        setMediumArticles(medium);
        setWhitepapers(papers);
        setArticles(articleDocs);
        setPress(pressDocs);
      } catch (error) {
        console.error("Error loading docs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  // Convert DocItem to DocumentItem for UI
  const convertToDocumentItem = (doc: DocItem): DocumentItem => {
    return {
      title: doc.title,
      description: doc.description,
      date: doc.date,
      category: doc.icon,
      link: doc.type === "pdf" ? doc.content : undefined,
      url: doc.type === "external" ? doc.content : undefined,
      version: doc.id.includes("whitepaper") ? "V1.0" : undefined,
      readTime: doc.type === "external" ? "5 min read" : undefined,
    };
  };

  // Render icon component based on string name
  const getIconComponent = (iconName: string | undefined) => {
    switch (iconName) {
      case "lock":
        return Lock;
      case "shield":
        return Shield;
      case "coins":
        return Coins;
      case "file":
      case "file-text":
        return File;
      case "globe":
        return Globe;
      default:
        return FileText;
    }
  };

  const DocSection: React.FC<DocSectionProps> = ({
    title,
    items,
    icon: Icon,
  }) => (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="h-6 w-6 text-soless-blue" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.title + index}
            className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 hover:border-soless-blue transition-colors flex flex-col h-full"
          >
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                {item.category && (
                  <div className="text-xs text-soless-blue">
                    {item.category}
                  </div>
                )}
                {item.version && (
                  <div className="text-xs text-soless-blue">{item.version}</div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-300 text-sm mb-4">{item.description}</p>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{item.date}</span>
                {item.readTime && <span>{item.readTime}</span>}
              </div>
            </div>
            {item.url ? (
              // External Medium article links
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-soless-blue to-soless-purple px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full text-center mt-4"
              >
                Read on Medium
              </a>
            ) : item.link?.startsWith("/") ? (
              // Internal document links
              <Link
                to={item.link}
                className="inline-block bg-gradient-to-r from-soless-blue to-soless-purple px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full text-center mt-4"
              >
                Read
              </Link>
            ) : (
              // External document links
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-soless-blue to-soless-purple px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full text-center mt-4"
              >
                Read
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  const MarkdownDocItem = ({ doc }: { doc: DocItem }) => {
    const IconComponent = getIconComponent(doc.icon);

    return (
      <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 hover:border-soless-blue transition-colors flex flex-col h-full">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-soless-blue">{doc.icon || "doc"}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            {doc.title || "Technical Documentation"}
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            {doc.description ||
              "Detailed technical specifications and architecture overview"}
          </p>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{doc.date}</span>
          </div>
        </div>
        <Link
          to={`/docs/${doc.id}`}
          className="inline-block bg-gradient-to-r from-soless-blue to-soless-purple px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full text-center mt-4"
        >
          Read
        </Link>
      </div>
    );
  };

  const MarkdownDocsSection = () => (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-soless-blue" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
          Technical Architecture
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {markdownDocs.map((doc) => (
          <MarkdownDocItem key={doc.id} doc={doc} />
        ))}
      </div>
    </section>
  );

  // Admin form section for easier content management
  const AdminSection = () => {
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [formType, setFormType] = useState<
      "medium" | "github" | "edit" | null
    >(null);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [formState, setFormState] = useState({
      // Medium article form
      medium: {
        title: "",
        description: "",
        url: "",
        category: "",
        readTime: "",
        date: new Date().toISOString().split("T")[0],
      },
      // GitHub doc form
      github: {
        title: "",
        description: "",
        content: "",
        icon: "",
        id: "",
      },
      // Edit existing doc form
      edit: {
        title: "",
        description: "",
        icon: "",
        content: "",
      },
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<
      "success" | "error" | null
    >(null);

    const handleInputChange = (
      type: "medium" | "github" | "edit",
      field: string,
      value: string
    ) => {
      setFormState((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      }));
    };

    // Load a document into the edit form
    const loadDocForEditing = async (docId: string) => {
      setSelectedDocId(docId);

      // Find doc in current state first
      const doc = [...markdownDocs].find((d) => d.id === docId);

      if (doc) {
        setFormState((prev) => ({
          ...prev,
          edit: {
            title: doc.title || "",
            description: doc.description || "",
            icon: doc.icon || "",
            content: doc.content || "",
          },
        }));
      }
    };

    // Handle edit form submission
    const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedDocId) return;

      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
        // In a real app, this would update the document in the database
        // For this demo, we'll just update it in memory

        // Update the document in state
        const updatedMarkdownDocs = [...markdownDocs].map((doc) => {
          if (doc.id === selectedDocId) {
            return {
              ...doc,
              title: formState.edit.title,
              description: formState.edit.description,
              icon: formState.edit.icon,
              content: formState.edit.content,
            };
          }
          return doc;
        });

        // Update state
        setMarkdownDocs(updatedMarkdownDocs);
        setSubmitStatus("success");

        // In a production app, we would call an API here
        console.log("Document updated:", {
          id: selectedDocId,
          ...formState.edit,
        });
      } catch (error) {
        console.error("Error updating document:", error);
        setSubmitStatus("error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleMediumSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
        const success = await documentationApi.addMediumArticle({
          title: formState.medium.title,
          description: formState.medium.description,
          url: formState.medium.url,
          category: formState.medium.category,
          readTime: formState.medium.readTime,
          date: formState.medium.date,
        });

        if (success) {
          setSubmitStatus("success");
          // Reset form
          setFormState((prev) => ({
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

          // Reload docs
          const allDocs = await documentationApi.getAllDocs();
          const medium = allDocs.filter(
            (doc) => doc.type === "external" && doc.icon === "globe"
          );
          setMediumArticles(medium);
        } else {
          setSubmitStatus("error");
        }
      } catch (error) {
        console.error("Error adding Medium article:", error);
        setSubmitStatus("error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleGithubSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
        const success = await documentationApi.addMarkdownDocument({
          title: formState.github.title,
          description: formState.github.description,
          content: formState.github.content,
          icon: formState.github.icon,
          id: formState.github.id,
        });

        if (success) {
          setSubmitStatus("success");
          // Reset form
          setFormState((prev) => ({
            ...prev,
            github: {
              title: "",
              description: "",
              content: "",
              icon: "",
              id: "",
            },
          }));

          // Reload docs
          const allDocs = await documentationApi.getAllDocs();
          const markdown = allDocs.filter((doc) => doc.type === "markdown");
          setMarkdownDocs(markdown);
        } else {
          setSubmitStatus("error");
        }
      } catch (error) {
        console.error("Error adding GitHub document:", error);
        setSubmitStatus("error");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="mb-12">
        {/* Admin button - normally this would be access controlled */}
        <button
          onClick={() => setShowAdminForm(!showAdminForm)}
          className="bg-black/50 border border-soless-blue/40 px-4 py-2 rounded-lg text-sm mb-4"
        >
          {showAdminForm ? "Hide Admin" : "Admin Tools"}
        </button>

        {showAdminForm && (
          <div className="bg-black/50 border border-soless-blue/40 p-6 rounded-xl mb-6">
            <h3 className="text-xl font-bold text-soless-blue mb-4">
              Add New Content
            </h3>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setFormType("medium");
                  setSelectedDocId(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  formType === "medium"
                    ? "bg-soless-blue text-white"
                    : "bg-black/50 text-gray-300"
                }`}
              >
                Add Medium Article
              </button>
              <button
                onClick={() => {
                  setFormType("github");
                  setSelectedDocId(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  formType === "github"
                    ? "bg-soless-blue text-white"
                    : "bg-black/50 text-gray-300"
                }`}
              >
                Add GitHub Doc
              </button>
              <button
                onClick={() => {
                  setFormType("edit");
                  setSelectedDocId(null);
                }}
                className={`px-4 py-2 rounded-lg ${
                  formType === "edit"
                    ? "bg-soless-blue text-white"
                    : "bg-black/50 text-gray-300"
                }`}
              >
                Edit Existing Doc
              </button>
            </div>

            {formType === "medium" && (
              <form onSubmit={handleMediumSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formState.medium.title}
                    onChange={(e) =>
                      handleInputChange("medium", "title", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formState.medium.description}
                    onChange={(e) =>
                      handleInputChange("medium", "description", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2 h-24"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Medium URL</label>
                  <input
                    type="url"
                    value={formState.medium.url}
                    onChange={(e) =>
                      handleInputChange("medium", "url", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Category</label>
                    <input
                      type="text"
                      value={formState.medium.category}
                      onChange={(e) =>
                        handleInputChange("medium", "category", e.target.value)
                      }
                      className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={formState.medium.readTime}
                      onChange={(e) =>
                        handleInputChange("medium", "readTime", e.target.value)
                      }
                      className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                      placeholder="e.g. 5 min read"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formState.medium.date}
                    onChange={(e) =>
                      handleInputChange("medium", "date", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-soless-blue to-soless-purple px-6 py-2 rounded-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Medium Article"}
                  </button>

                  {submitStatus === "success" && (
                    <span className="ml-4 text-green-500">
                      Added successfully!
                    </span>
                  )}

                  {submitStatus === "error" && (
                    <span className="ml-4 text-red-500">
                      Error adding article
                    </span>
                  )}
                </div>
              </form>
            )}

            {formType === "github" && (
              <form onSubmit={handleGithubSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={formState.github.title}
                    onChange={(e) =>
                      handleInputChange("github", "title", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formState.github.description}
                    onChange={(e) =>
                      handleInputChange("github", "description", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2 h-24"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Markdown Content
                  </label>
                  <textarea
                    value={formState.github.content}
                    onChange={(e) =>
                      handleInputChange("github", "content", e.target.value)
                    }
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2 h-48 font-mono text-sm"
                    required
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Icon</label>
                    <input
                      type="text"
                      value={formState.github.icon}
                      onChange={(e) =>
                        handleInputChange("github", "icon", e.target.value)
                      }
                      className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                      placeholder="e.g. lock, shield, coins"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Document ID
                    </label>
                    <input
                      type="text"
                      value={formState.github.id}
                      onChange={(e) =>
                        handleInputChange("github", "id", e.target.value)
                      }
                      className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                      placeholder="e.g. api-reference"
                      required
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-soless-blue to-soless-purple px-6 py-2 rounded-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add GitHub Doc"}
                  </button>

                  {submitStatus === "success" && (
                    <span className="ml-4 text-green-500">
                      Added successfully!
                    </span>
                  )}

                  {submitStatus === "error" && (
                    <span className="ml-4 text-red-500">
                      Error adding document
                    </span>
                  )}
                </div>
              </form>
            )}

            {formType === "edit" && (
              <>
                {/* Document selector */}
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">
                    Select Document to Edit
                  </label>
                  <select
                    className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                    value={selectedDocId || ""}
                    onChange={(e) => loadDocForEditing(e.target.value)}
                  >
                    <option value="">Select a document...</option>
                    {markdownDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title || doc.id}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDocId && (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Document Title
                      </label>
                      <input
                        type="text"
                        value={formState.edit.title}
                        onChange={(e) =>
                          handleInputChange("edit", "title", e.target.value)
                        }
                        className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formState.edit.description}
                        onChange={(e) =>
                          handleInputChange(
                            "edit",
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2 h-24"
                        required
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Icon</label>
                      <select
                        value={formState.edit.icon}
                        onChange={(e) =>
                          handleInputChange("edit", "icon", e.target.value)
                        }
                        className="w-full bg-black/70 border border-soless-blue/40 rounded-lg p-2"
                      >
                        <option value="file">file</option>
                        <option value="file-text">file-text</option>
                        <option value="lock">lock</option>
                        <option value="shield">shield</option>
                        <option value="coins">coins</option>
                        <option value="globe">globe</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-soless-blue to-soless-purple px-6 py-2 rounded-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Updating..." : "Update Document"}
                      </button>

                      {submitStatus === "success" && (
                        <span className="ml-4 text-green-500">
                          Updated successfully!
                        </span>
                      )}

                      {submitStatus === "error" && (
                        <span className="ml-4 text-red-500">
                          Error updating document
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            <div className="mt-6 text-sm text-gray-400">
              <p>
                Note: In a production environment, this would be connected to a
                database or CMS for persistent storage.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Banner */}
      <div className="mb-8">
        <img
          src="/assets/images/DocBanner.png"
          alt="SOLess Banner"
          className="w-full h-auto rounded-xl"
        />
      </div>

      {/* Admin Controls - would be access-controlled in production */}
      <AdminSection />

      {/* Main Content - reordered as requested */}
      <div>
        {/* Medium Articles First */}
        <DocSection
          title="Medium Articles"
          items={mediumArticles}
          icon={Globe}
        />

        {/* GitHub Docs Second */}
        {!loading && <MarkdownDocsSection />}

        {/* Whitepapers Third */}
        <DocSection title="Whitepapers" items={whitepapers} icon={BookOpen} />
      </div>

      {/* Soulie at bottom */}
      <div className="flex justify-center mt-12">
        <img
          src="/assets/images/PresaleSoulie.png"
          alt="Soulie"
          className="h-48 w-auto"
        />
      </div>
    </div>
  );
};

export default Documentation;
