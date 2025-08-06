// src/utils/documentLoader.js
const fs = require("fs-extra");
const path = require("path");
const pdfParse = require("pdf-parse");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();
const ts = require("typescript");
const parser = require("@typescript-eslint/parser");

// Define a documents directory
const DOCS_DIR = path.join(__dirname, "../../docs");

// Ensure the docs directory exists
fs.ensureDirSync(DOCS_DIR);

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
async function processMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const result = md.render(content);
    // Convert HTML to plain text (simple approach)
    const plainText = result
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return plainText;
  } catch (error) {
    console.error(`Error processing Markdown ${filePath}:`, error);
    return "";
  }
}

// Process a text file
async function processText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error(`Error processing text file ${filePath}:`, error);
    return "";
  }
}

// Process a TypeScript/TSX file
async function processTypeScript(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    let extractedContent = "";

    // Parse the TypeScript file
    let sourceFile;
    try {
      sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
    } catch (parseError) {
      console.error(`Failed to parse TypeScript file ${filePath}:`, parseError);
      return `Error: Failed to parse TypeScript file. ${parseError.message}`;
    }

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

        // Recursively process child nodes
        node.forEachChild((child) => extractInfo(child));
      } catch (nodeError) {
        console.error(`Error processing node in ${filePath}:`, nodeError);
        // Continue processing other nodes
      }
    }

    // Start processing from the root node
    extractInfo(sourceFile);
    return extractedContent || "No extractable content found";
  } catch (error) {
    console.error(`Error processing TypeScript file ${filePath}:`, error);
    return `Error: Failed to read or process file. ${error.message}`;
  }
}

// Process a file with enhanced handling
async function processFile(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const stats = await fs.promises.stat(filePath);

  // Enhanced file type detection
  const isSourceCode = [".js", ".ts", ".tsx", ".jsx", ".py", ".java"].includes(
    ext
  );
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

  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    return {
      path: filePath,
      content,
      size: stats.size,
      type: isSourceCode ? "source" : "documentation",
      extension: ext,
      lastModified: stats.mtime,
      processed: true,
    };
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
  ".js",
  ".ts",
  ".tsx",
  ".jsx", // JavaScript/TypeScript
  ".py",
  ".java", // Other source code
]);

// Load all documents from the docs directory
async function loadAllDocuments() {
  try {
    // Check if directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      console.log("Documents directory not found, creating it.");
      fs.mkdirSync(DOCS_DIR, { recursive: true });
      return "No documents found. Please add documents to the docs directory.";
    }

    const files = await fs.readdir(DOCS_DIR);
    let combinedContent = "";

    for (const file of files) {
      const filePath = path.join(DOCS_DIR, file);
      const fileStats = await fs.stat(filePath);

      if (fileStats.isFile()) {
        const extension = path.extname(file).toLowerCase();
        let content = "";

        if (extension === ".pdf") {
          content = await processPdf(filePath);
        } else if (extension === ".md") {
          content = await processMarkdown(filePath);
        } else if (extension === ".txt" || extension === ".text") {
          content = await processText(filePath);
        } else if (extension === ".ts" || extension === ".tsx") {
          content = await processTypeScript(filePath);
        }

        if (content) {
          combinedContent += `\n\n# Document: ${file}\n${content}`;
        }
      }
    }

    return combinedContent || "No readable documents found.";
  } catch (error) {
    console.error("Error loading documents:", error);
    return "Error loading documents.";
  }
}

module.exports = {
  loadAllDocuments,
  processPdf,
  processMarkdown,
  processText,
  processTypeScript,
  processFile,
  DOCS_DIR,
};
