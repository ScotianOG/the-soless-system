// src/utils/documentLoader.js
const fs = require("fs-extra");
const path = require("path");
const pdfParse = require("pdf-parse");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();
const ts = require("typescript");
const documentCache = require("./documentCache");

// Define a documents directory
const DOCS_DIR = path.join(__dirname, "../../docs");

// Ensure the docs directory exists
fs.ensureDirSync(DOCS_DIR);

// Maximum file size to process (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Performance tracking
let loadMetrics = {
  totalLoads: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageLoadTime: 0,
  lastLoadTime: 0,
};

// Process a PDF file
async function processPdf(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
    return "";
  }
}

// Process a Markdown file
async function processMarkdown(input) {
  try {
    // Handle both file path and content string
    let content;
    if (
      typeof input === "string" &&
      fs.existsSync(input) &&
      fs.statSync(input).isFile()
    ) {
      content = await fs.readFile(input, "utf8");
    } else {
      content = input; // Assume input is content string
    }

    const result = md.render(content);
    // Convert HTML to plain text (simple approach)
    const plainText = result
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return plainText;
  } catch (error) {
    console.error(`Error processing Markdown:`, error);
    return typeof input === "string" ? input : "";
  }
}

// Process a text file
async function processText(input) {
  try {
    // Handle both file path and content string
    if (
      typeof input === "string" &&
      fs.existsSync(input) &&
      fs.statSync(input).isFile()
    ) {
      return await fs.readFile(input, "utf8");
    }
    return input; // Assume input is content string
  } catch (error) {
    console.error(`Error processing text:`, error);
    return typeof input === "string" ? input : "";
  }
}

// Process a TypeScript/TSX file
async function processTypeScript(input) {
  try {
    // Handle both file path and content
    let content;
    let filename;

    if (
      typeof input === "string" &&
      fs.existsSync(input) &&
      fs.statSync(input).isFile()
    ) {
      content = await fs.readFile(input, "utf8");
      filename = path.basename(input);
    } else {
      content = input; // Assume input is content string
      filename = "typescript-content"; // Default filename
    }

    // If input content contains a filename reference, extract it
    const filenameMatch = content.match(/# File: (.+)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = path.basename(filenameMatch[1]);
    }

    // For TypeScript/TSX files, first try to extract the content part if it has the GitHub header
    const contentMatch = content.match(
      /^# Source: GitHub Repository.+?\n# File: .+?\n\n([\s\S]+)$/
    );
    if (contentMatch) {
      content = contentMatch[1];
    }

    // Parse the TypeScript file
    let sourceFile;
    try {
      sourceFile = ts.createSourceFile(
        filename,
        content,
        ts.ScriptTarget.Latest,
        true,
        filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
    } catch (parseError) {
      console.warn(`Warning: Failed to parse as TypeScript:`, parseError);
      // Return the raw content if parsing fails
      return content;
    }

    let extractedContent = "";

    // Extract comments and basic structure
    function extractInfo(node) {
      try {
        // Get JSDoc comments
        const nodeText = node.getFullText(sourceFile);
        const trivia = nodeText.substring(
          0,
          node.getLeadingTriviaWidth(sourceFile)
        );
        const comments = trivia.match(/\/\*\*[\s\S]*?\*\/|\/\/.*/g) || [];

        if (comments.length) {
          extractedContent += comments.join("\n") + "\n";
        }

        // For class declarations, get class name, type parameters, and member info
        if (ts.isClassDeclaration(node)) {
          const className = node.name ? node.name.text : "Anonymous Class";
          const typeParams = node.typeParameters
            ? `<${node.typeParameters.map((tp) => tp.name.text).join(", ")}>`
            : "";
          const heritage =
            node.heritageClauses
              ?.map((hc) =>
                hc.types.map((t) => t.expression.getText(sourceFile)).join(", ")
              )
              .join(" ") || "";

          extractedContent += `\nClass: ${className}${typeParams}${
            heritage ? ` extends ${heritage}` : ""
          }\n`;

          node.members.forEach((member) => {
            if (member.name) {
              const modifiers =
                member.modifiers?.map((m) => m.getText(sourceFile)).join(" ") ||
                "";
              const type = member.type
                ? `: ${member.type.getText(sourceFile)}`
                : "";
              extractedContent += `- ${modifiers} ${member.name.getText(
                sourceFile
              )}${type}\n`;
            }
          });
        }

        // For function declarations and methods, get full signature
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
          const functionName = node.name
            ? node.name.text
            : "Anonymous Function";
          const typeParams = node.typeParameters
            ? `<${node.typeParameters.map((tp) => tp.name.text).join(", ")}>`
            : "";
          const params = node.parameters
            .map(
              (p) =>
                `${p.name.getText(sourceFile)}${
                  p.type ? ": " + p.type.getText(sourceFile) : ""
                }`
            )
            .join(", ");
          const returnType = node.type
            ? `: ${node.type.getText(sourceFile)}`
            : "";

          extractedContent += `\nFunction: ${functionName}${typeParams}(${params})${returnType}\n`;
        }

        // For interface declarations
        if (ts.isInterfaceDeclaration(node)) {
          const interfaceName = node.name.text;
          const typeParams = node.typeParameters
            ? `<${node.typeParameters.map((tp) => tp.name.text).join(", ")}>`
            : "";
          const heritage =
            node.heritageClauses
              ?.map((hc) =>
                hc.types.map((t) => t.expression.getText(sourceFile)).join(", ")
              )
              .join(" ") || "";

          extractedContent += `\nInterface: ${interfaceName}${typeParams}${
            heritage ? ` extends ${heritage}` : ""
          }\n`;

          node.members.forEach((member) => {
            if (member.name) {
              const type = member.type
                ? `: ${member.type.getText(sourceFile)}`
                : "";
              extractedContent += `- ${member.name.getText(
                sourceFile
              )}${type}\n`;
            }
          });
        }

        // For type aliases
        if (ts.isTypeAliasDeclaration(node)) {
          const typeName = node.name.text;
          const typeParams = node.typeParameters
            ? `<${node.typeParameters.map((tp) => tp.name.text).join(", ")}>`
            : "";
          const type = node.type.getText(sourceFile);

          extractedContent += `\nType: ${typeName}${typeParams} = ${type}\n`;
        }

        // For enum declarations
        if (ts.isEnumDeclaration(node)) {
          const enumName = node.name.text;
          extractedContent += `\nEnum: ${enumName}\n`;

          node.members.forEach((member) => {
            const value = member.initializer
              ? ` = ${member.initializer.getText(sourceFile)}`
              : "";
            extractedContent += `- ${member.name.getText(
              sourceFile
            )}${value}\n`;
          });
        }

        // For JSX/TSX elements (react components)
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          extractedContent += `\nReact Component: ${
            node.tagName?.getText(sourceFile) || "Anonymous"
          }\n`;

          // For JSX elements, extract attributes
          if (node.attributes && node.attributes.properties) {
            node.attributes.properties.forEach((prop) => {
              extractedContent += `- Prop: ${prop.name.getText(sourceFile)}\n`;
            });
          }
        }

        // Recursively process child nodes
        node.forEachChild((child) => extractInfo(child));
      } catch (nodeError) {
        console.error(`Error processing node:`, nodeError);
        // Continue processing other nodes
      }
    }

    // Start processing from the root node
    extractInfo(sourceFile);

    // If no content was extracted, preserve the original content
    if (!extractedContent.trim()) {
      return content;
    }

    // Include original header if present in the content
    const headerMatch = content.match(/^(# Source:.+\n# File:.+\n\n)/);
    const header = headerMatch ? headerMatch[1] : "";

    return header + extractedContent;
  } catch (error) {
    console.error(`Error processing TypeScript:`, error);
    return `Error: Failed to read or process file. ${error.message}`;
  }
}

// Process a file with enhanced handling
async function processFile(filePath, options = {}) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const stats = await fs.promises.stat(filePath);

    // Enhanced file type detection
    const isSourceCode = [
      ".js",
      ".ts",
      ".tsx",
      ".jsx",
      ".py",
      ".java",
      ".sol",
    ].includes(ext);
    const isDocumentation =
      [".md", ".txt"].includes(ext) ||
      path.basename(filePath).toLowerCase().includes("readme");

    // Skip processing for binary files or very large files
    if (!isSourceCode && !isDocumentation && stats.size > MAX_FILE_SIZE) {
      return {
        path: filePath,
        size: stats.size,
        type: "binary",
        processed: false,
      };
    }

    // Process content based on file type
    let content;
    let processedContent;

    try {
      content = await fs.promises.readFile(filePath, "utf8");

      // Process based on file type
      if (ext === ".ts" || ext === ".tsx") {
        processedContent = await processTypeScript(content);
      } else if (ext === ".md") {
        processedContent = await processMarkdown(content);
      } else if (ext === ".txt") {
        processedContent = await processText(content);
      } else {
        processedContent = content; // Default to raw content
      }

      return {
        path: filePath,
        content: processedContent,
        rawContent: content,
        size: stats.size,
        type: isSourceCode ? "source" : "documentation",
        extension: ext,
        lastModified: stats.mtime,
        processed: true,
      };
    } catch (readError) {
      console.error(`Error reading file ${filePath}:`, readError);
      return {
        path: filePath,
        error: readError.message,
        processed: false,
      };
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return {
      path: filePath,
      error: error.message,
      processed: false,
    };
  }
}

// Add TypeScript extensions to allowed types
const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".txt", // Documentation
  ".pdf", // PDF documents
  ".js",
  ".ts",
  ".tsx",
  ".jsx", // JavaScript/TypeScript
  ".py",
  ".java", // Other source code
  ".sol", // Solana/Solidity files
]);

// Process a single file with caching
async function processFileWithCache(filePath) {
  const startTime = Date.now();

  try {
    // Check cache first
    if (await documentCache.isCacheValid(filePath)) {
      const cachedContent = documentCache.getCachedDocument(filePath);
      if (cachedContent) {
        loadMetrics.cacheHits++;
        console.log(
          `📁 Cache hit for ${path.basename(filePath)} (${
            Date.now() - startTime
          }ms)`
        );
        return cachedContent;
      }
    }

    loadMetrics.cacheMisses++;

    // Process file
    const fileStats = await fs.stat(filePath);
    const extension = path.extname(filePath).toLowerCase();
    let content = "";

    // Skip if file is too large
    if (fileStats.size > MAX_FILE_SIZE) {
      console.warn(
        `⚠️ Skipping large file: ${path.basename(filePath)} (${Math.round(
          fileStats.size / 1024
        )}KB)`
      );
      return "";
    }

    if (extension === ".pdf") {
      content = await processPdf(filePath);
    } else if (extension === ".md") {
      content = await processMarkdown(filePath);
    } else if (extension === ".txt" || extension === ".text") {
      content = await processText(filePath);
    } else if (extension === ".ts" || extension === ".tsx") {
      content = await processTypeScript(filePath);
    } else {
      try {
        content = await fs.readFile(filePath, "utf8");
      } catch (readError) {
        console.error(`Error reading file ${filePath}:`, readError);
        return "";
      }
    }

    // Cache the processed content
    if (content) {
      await documentCache.setCachedDocument(filePath, content);
      console.log(
        `💾 Cached ${path.basename(filePath)} (${Date.now() - startTime}ms)`
      );
    }

    return content;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return "";
  }
}
// Load all documents from the docs directory with caching and parallel processing
async function loadAllDocuments() {
  const startTime = Date.now();

  try {
    // Check if we have a valid cached knowledge base
    const cachedKnowledgeBase = documentCache.getCachedKnowledgeBase();
    if (cachedKnowledgeBase) {
      loadMetrics.cacheHits++;
      console.log(`🚀 Knowledge base cache hit (${Date.now() - startTime}ms)`);
      return cachedKnowledgeBase;
    }

    loadMetrics.cacheMisses++;
    console.log(`📚 Loading documents from ${DOCS_DIR}...`);

    // Check if directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      console.log("Documents directory not found, creating it.");
      fs.mkdirSync(DOCS_DIR, { recursive: true });
      return "No documents found. Please add documents to the docs directory.";
    }

    const files = await fs.readdir(DOCS_DIR);

    // Filter for supported file types
    const supportedFiles = files.filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return ALLOWED_EXTENSIONS.has(extension);
    });

    if (supportedFiles.length === 0) {
      return "No supported documents found.";
    }

    console.log(
      `📄 Processing ${supportedFiles.length} documents in parallel...`
    );

    // Process files in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 5; // Process max 5 files simultaneously
    const results = [];

    for (let i = 0; i < supportedFiles.length; i += CONCURRENCY_LIMIT) {
      const batch = supportedFiles.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = batch.map(async (file) => {
        const filePath = path.join(DOCS_DIR, file);
        const fileStats = await fs.stat(filePath);

        if (fileStats.isFile()) {
          const content = await processFileWithCache(filePath);
          if (content) {
            return `\n\n# Document: ${file}\n${content}`;
          }
        }
        return "";
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const combinedContent = results.filter((content) => content).join("");
    const finalContent = combinedContent || "No readable documents found.";

    // Cache the combined knowledge base
    documentCache.setCachedKnowledgeBase(finalContent);

    const totalTime = Date.now() - startTime;
    loadMetrics.totalLoads++;
    loadMetrics.lastLoadTime = totalTime;
    loadMetrics.averageLoadTime =
      (loadMetrics.averageLoadTime * (loadMetrics.totalLoads - 1) + totalTime) /
      loadMetrics.totalLoads;

    console.log(
      `✅ Knowledge base loaded in ${totalTime}ms (${Math.round(
        finalContent.length / 1024
      )}KB)`
    );

    return finalContent;
  } catch (error) {
    console.error("Error loading documents:", error);
    return "Error loading documents.";
  }
}

// Get performance metrics for monitoring
function getLoadMetrics() {
  return {
    ...loadMetrics,
    cacheStats: documentCache.getCacheStats(),
    cacheHitRate:
      loadMetrics.totalLoads > 0
        ? `${Math.round(
            (loadMetrics.cacheHits /
              (loadMetrics.cacheHits + loadMetrics.cacheMisses)) *
              100
          )}%`
        : "0%",
  };
}

// Preload documents at startup (optional)
async function preloadDocuments() {
  console.log("🔄 Preloading document cache...");
  await loadAllDocuments();
}

// Clear document cache
function clearDocumentCache() {
  documentCache.clearCache();
  loadMetrics = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLoadTime: 0,
    lastLoadTime: 0,
  };
  console.log("🧹 Document cache cleared");
}

module.exports = {
  loadAllDocuments,
  processPdf,
  processMarkdown,
  processText,
  processTypeScript,
  processFile,
  processFileWithCache,
  getLoadMetrics,
  preloadDocuments,
  clearDocumentCache,
  DOCS_DIR,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};
