/**
 * SOLess Admin Panel JavaScript
 */

// Global variables
let conversationId = null;
const apiBaseUrl = "/api"; // Base URL for all API endpoints
const chatApiUrl = "/api/solessbot"; // Specific URL for chat endpoints
let repoFiles = [];
let repoInfo = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Chat Elements
  const chatContainer = document.getElementById("chat-container");
  const messagesContainer = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  // Document Elements
  const uploadForm = document.getElementById("upload-form");
  const documentsContainer = document.getElementById("documents-container");

  // Integration Elements
  const widgetCodeBox = document.getElementById("widget-code");
  const copyWidgetButton = document.getElementById("copy-widget-button");

  // Settings Elements
  const personaForm = document.getElementById("persona-form");
  const telegramForm = document.getElementById("telegram-form");

  // Initialize functionality based on what elements exist on the page
  if (chatContainer) initializeChat();
  if (uploadForm) initializeDocumentUpload();
  if (widgetCodeBox) initializeIntegration();
  if (personaForm) initializePersonaSettings();
  if (telegramForm) initializeTelegramSettings();

  // Initialize navigation
  initializeNavigation();
});

/**
 * Navigation Functionality
 */
function initializeNavigation() {
  // Set active navigation item based on current page
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-links a, .sidebar-nav a");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
}

/**
 * Chat Functionality
 */
async function initializeChat() {
  try {
    const response = await fetch(`${apiBaseUrl}/conversations`, {
      method: "POST",
    });
    const data = await response.json();
    conversationId = data.conversationId;

    // Add welcome message
    addBotMessage(
      "Admin connection established. How can I assist with the SOLess project today?"
    );
  } catch (error) {
    console.error("Error initializing chat:", error);
    addBotMessage(
      "Unable to connect to chat interface. Please check the server connection."
    );
  }

  // Event listeners
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
      sendMessage(message);
    }
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const message = messageInput.value.trim();
      if (message) {
        sendMessage(message);
      }
    }
  });
}

async function sendMessage(message) {
  if (!conversationId) {
    console.error("No active conversation");
    return;
  }

  try {
    // Add user message to UI
    addUserMessage(message);

    // Clear input
    document.getElementById("message-input").value = "";

    // Call API
    const response = await fetch(
      `${apiBaseUrl}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );

    const data = await response.json();

    // Add bot response to UI
    addBotMessage(data.message, data.persona);
  } catch (error) {
    console.error("Error sending message:", error);
    addBotMessage("Communication error. Please try again later.");
  }
}

function addUserMessage(text) {
  const messagesContainer = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message user";
  messageElement.textContent = text;
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

function addBotMessage(text, persona) {
  const messagesContainer = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message bot";
  messageElement.textContent = text;

  if (persona) {
    const personaElement = document.createElement("div");
    personaElement.className = "persona";
    personaElement.textContent = persona.name;
    messageElement.appendChild(personaElement);
  }

  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

function scrollToBottom() {
  const messagesContainer = document.getElementById("messages");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Document Management Functionality
 */
function initializeDocumentUpload() {
  // Load document list
  loadDocuments();

  // Handle file selection
  const fileInput = document.getElementById("document");
  const selectedFilesContainer = document.getElementById("selected-files");

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;

      // Clear previously selected files display
      selectedFilesContainer.innerHTML = "";

      if (files.length > 0) {
        // Show selected files
        Array.from(files).forEach((file, index) => {
          const fileDiv = document.createElement("div");
          fileDiv.className = "selected-file";

          // Format file size
          const sizeInKB = file.size / 1024;
          const sizeFormatted =
            sizeInKB > 1024
              ? `${(sizeInKB / 1024).toFixed(2)} MB`
              : `${sizeInKB.toFixed(2)} KB`;

          fileDiv.innerHTML = `
            <span class="selected-file-name">${file.name}</span>
            <span class="selected-file-size">${sizeFormatted}</span>
            <div class="upload-progress">
              <div class="upload-progress-bar" id="progress-${index}"></div>
            </div>
          `;

          selectedFilesContainer.appendChild(fileDiv);
        });
      }
    });
  }

  // Handle form submission
  const uploadForm = document.getElementById("upload-form");

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("document");
    if (!fileInput.files.length) {
      alert("Please select one or more files to upload");
      return;
    }

    const formData = new FormData();
    // Append all selected files to the form data
    Array.from(fileInput.files).forEach((file) => {
      formData.append("document", file);
    });

    try {
      const response = await fetch(`${apiBaseUrl}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fileInput.value = "";
        selectedFilesContainer.innerHTML = "";
        loadDocuments();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Error uploading documents");
    }
  });

  // Handle GitHub repository form submission
  const githubForm = document.getElementById("github-form");
  if (githubForm) {
    githubForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const repoInput = document.getElementById("repository");
      const repository = repoInput.value.trim();

      if (!repository) {
        alert("Please enter a GitHub repository in the format owner/repo");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes timeout

      try {
        const response = await fetch(
          `${apiBaseUrl}/documents/github/structure`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ repository }),
            signal: controller.signal,
            credentials: "same-origin",
            keepalive: true,
          }
        );

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.error || `Server error: ${response.status}`);
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const result = await response.json();
        if (result.files && result.repoInfo) {
          repoFiles = result.files;
          repoInfo = result.repoInfo;
          displayFileTree(result.files);
          document.getElementById("github-file-list").style.display = "block";
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error loading GitHub repository:", error);
        if (error.name === "AbortError") {
          alert(
            "Operation timed out - please check your connection and try again"
          );
        } else {
          alert(
            `Failed to load repository: ${
              error.message || "Connection error - please try again"
            }`
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  // Initialize file selection controls
  initializeFileSelectionControls();
}

function displayFileTree(files) {
  const container = document.getElementById("repo-files");
  container.innerHTML = "";

  // Enhanced caching
  const filesByPath = new Map();
  const tree = {};
  const expandedDirs = new Set();
  const processedDirs = new Map();
  const dirSizes = new Map();
  const fileTypes = new Map();

  // Create file lookup and index all paths
  files.forEach((file) => {
    filesByPath.set(file.path, file);

    // Pre-process file types
    const ext = file.path.split(".").pop()?.toLowerCase();
    fileTypes.set(file.path, {
      isTypeScript: ext === "ts" || ext === "tsx",
      isDocumentation:
        ext === "md" ||
        ext === "txt" ||
        file.path.toLowerCase().includes("readme"),
      isSourceCode: [
        "js",
        "ts",
        "tsx",
        "jsx",
        "py",
        "java",
        "c",
        "cpp",
        "h",
        "hpp",
      ].includes(ext),
    });
  });

  // Extract all unique paths including intermediate directories
  const allPaths = new Set();
  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentPath = "";
    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      allPaths.add(currentPath);
    });
  });

  // Function to lazily calculate directory size with caching
  function getDirSize(dirPath) {
    if (dirSizes.has(dirPath)) return dirSizes.get(dirPath);

    const size = Array.from(filesByPath.entries()).reduce(
      (sum, [path, file]) => {
        if (path === dirPath || path.startsWith(dirPath + "/")) {
          return sum + (file.size || 0);
        }
        return sum;
      },
      0
    );

    dirSizes.set(dirPath, size);
    return size;
  }

  // Build initial tree structure with lazy loading
  allPaths.forEach((path) => {
    const isFile = filesByPath.has(path);
    if (isFile) {
      const file = filesByPath.get(path);
      const fileType = fileTypes.get(path);
      tree[path] = {
        ...file,
        isFile: true,
        ...fileType,
      };
    } else {
      tree[path] = {
        isDir: true,
        path: path,
        children: null, // Lazy load
        size: getDirSize(path),
        processed: false,
      };
    }
  });

  // Function to process directory contents only when needed
  function processDirectory(dirPath) {
    if (processedDirs.has(dirPath)) {
      return processedDirs.get(dirPath);
    }

    const children = {};
    const dirPrefix = dirPath + "/";

    Array.from(filesByPath.entries())
      .filter(([path]) => {
        const relativePath = path.slice(dirPrefix.length);
        const parts = relativePath.split("/");
        return path.startsWith(dirPrefix) && parts.length === 1;
      })
      .forEach(([path, file]) => {
        const name = path.slice(dirPrefix.length);
        if (filesByPath.has(path)) {
          const fileType = fileTypes.get(path);
          children[name] = {
            ...file,
            isFile: true,
            ...fileType,
          };
        }
      });

    // Add immediate subdirectories
    allPaths.forEach((path) => {
      if (path.startsWith(dirPrefix)) {
        const relativePath = path.slice(dirPrefix.length);
        const parts = relativePath.split("/");
        if (parts.length === 1 && !filesByPath.has(path)) {
          children[parts[0]] = {
            isDir: true,
            path: path,
            children: null,
            size: getDirSize(path),
            processed: false,
          };
        }
      }
    });

    processedDirs.set(dirPath, children);
    return children;
  }

  // Rest of your existing createTreeHTML function with the toggle logic
  // ...existing code...
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function initializeFileSelectionControls() {
  const selectAll = document.getElementById("select-all");
  const selectDocs = document.getElementById("select-docs");
  const importSelected = document.getElementById("import-selected");

  if (selectAll) {
    selectAll.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(
        "#repo-files input[type=checkbox]"
      );
      checkboxes.forEach((cb) => (cb.checked = true));
    });
  }

  if (selectDocs) {
    selectDocs.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(
        "#repo-files input[type=checkbox]"
      );
      checkboxes.forEach((cb) => {
        const path = cb.dataset.path.toLowerCase();
        cb.checked =
          path.includes("readme") ||
          path.includes("docs/") ||
          path.endsWith(".md") ||
          path.endsWith(".txt") ||
          path.endsWith(".ts") ||
          path.endsWith(".tsx") ||
          path.includes("documentation") ||
          path.includes("types/");
      });
    });
  }

  if (importSelected) {
    importSelected.addEventListener("click", async () => {
      const selectedFiles = Array.from(
        document.querySelectorAll("#repo-files input[type=checkbox]:checked")
      ).map((cb) => cb.dataset.path);

      if (selectedFiles.length === 0) {
        alert("Please select at least one file to import");
        return;
      }

      if (selectedFiles.length > 100) {
        alert(
          "Too many files selected. Please select fewer files (maximum 100)."
        );
        return;
      }

      try {
        if (!repoInfo || !repoInfo.owner || !repoInfo.repo) {
          throw new Error(
            "Repository information is missing. Please reload the repository."
          );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes timeout

        const response = await fetch(`${apiBaseUrl}/documents/github/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            selectedFiles,
          }),
          credentials: "same-origin",
          signal: controller.signal,
          keepalive: true,
        });

        try {
          if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const error = await response.json();
              throw new Error(
                error.error || `Server error: ${response.status}`
              );
            } else {
              throw new Error(`Server error: ${response.status}`);
            }
          }

          const result = await response.json();
          alert(result.message);
          document.getElementById("github-file-list").style.display = "none";
          document.getElementById("repository").value = "";
          repoFiles = [];
          repoInfo = null;
          loadDocuments();
        } catch (responseError) {
          throw responseError;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.error("Operation timed out");
          alert(
            "Operation timed out - please try selecting fewer files or check your connection"
          );
        } else {
          console.error("Error importing files:", error);
          alert(
            `Import failed: ${
              error.message || "Connection error - please try again"
            }`
          );
        }
      }
    });
  }
}

async function loadDocuments() {
  const documentsContainer = document.getElementById("documents-container");
  if (!documentsContainer) return;

  try {
    const response = await fetch(`${apiBaseUrl}/documents`);
    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      documentsContainer.innerHTML = "";

      data.documents.forEach((doc) => {
        const item = document.createElement("div");
        item.className = "document-item";

        const name = document.createElement("div");
        name.className = "document-name";
        name.textContent = doc;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteDocument(doc);

        item.appendChild(name);
        item.appendChild(deleteBtn);
        documentsContainer.appendChild(item);
      });
    } else {
      documentsContainer.innerHTML = "<p>No documents uploaded yet.</p>";
    }
  } catch (error) {
    console.error("Error loading documents:", error);
    documentsContainer.innerHTML =
      "<p>Error loading documents. Please try again.</p>";
  }
}

async function deleteDocument(filename) {
  if (!confirm(`Are you sure you want to delete ${filename}?`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/documents/${filename}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadDocuments();
    } else {
      alert("Failed to delete document");
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    alert("Error deleting document");
  }
}

/**
 * Website Integration Functionality
 */
function initializeIntegration() {
  // Generate widget code
  const hostUrl = window.location.origin;
  const widgetCode = document.getElementById("widget-code");

  if (widgetCode) {
    widgetCode.textContent = `<!-- SOLess Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${hostUrl}/soulie/widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    window.SOLessConfig = {
      position: 'bottom-right',
      primaryColor: '#4a148c',
      welcomeMessage: 'Hello! Ask me about SOLess...'
    };
  })();
</script>`;
  }

  // Copy button functionality
  const copyButton = document.getElementById("copy-widget-button");

  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const codeText = widgetCode.textContent;
      navigator.clipboard
        .writeText(codeText)
        .then(() => {
          // Visual feedback
          copyButton.textContent = "Copied!";
          setTimeout(() => {
            copyButton.textContent = "Copy Code";
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          alert("Failed to copy code to clipboard");
        });
    });
  }
}

/**
 * Persona Settings Functionality
 */
async function initializePersonaSettings() {
  const personaForm = document.getElementById("persona-form");
  if (!personaForm) return;

  try {
    // Fetch current persona settings
    const response = await fetch(`${apiBaseUrl}/settings/persona`);
    if (response.ok) {
      const { persona } = await response.json();

      // Fill form with current settings
      document.getElementById("persona-name").value = persona.name || "";
      document.getElementById("persona-style").value = persona.style || "";
      document.getElementById("persona-background").value =
        persona.background || "";
    } else {
      console.warn("Could not load persona settings");
    }
  } catch (error) {
    console.error("Error loading persona settings:", error);
  }

  // Handle form submission
  personaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const personaData = {
      name: document.getElementById("persona-name").value.trim(),
      style: document.getElementById("persona-style").value.trim(),
      background: document.getElementById("persona-background").value.trim(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/settings/persona`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ persona: personaData }),
      });

      if (response.ok) {
        // Show success message
        alert("Persona settings saved successfully!");
      } else {
        const error = await response.json();
        alert(
          `Failed to save persona settings: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error saving persona settings:", error);
      alert("Error saving persona settings. Please try again.");
    }
  });
}

/**
 * Telegram Bot Settings Functionality
 */
async function initializeTelegramSettings() {
  const telegramForm = document.getElementById("telegram-form");
  const telegramStatus = document.getElementById("telegram-status");
  if (!telegramForm || !telegramStatus) return;

  try {
    // Fetch current telegram settings
    const response = await fetch(`${apiBaseUrl}/settings/telegram`);
    if (response.ok) {
      const { enabled, token, status } = await response.json();

      // Fill form with current settings
      document.getElementById("telegram-enabled").checked = enabled;
      document.getElementById("telegram-token").value = token || "";

      // Update status display
      updateTelegramStatus(status);
    } else {
      console.warn("Could not load telegram settings");
      updateTelegramStatus("inactive");
    }
  } catch (error) {
    console.error("Error loading telegram settings:", error);
    updateTelegramStatus("error", "Could not connect to server");
  }

  // Handle form submission
  telegramForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const telegramData = {
      enabled: document.getElementById("telegram-enabled").checked,
      token: document.getElementById("telegram-token").value.trim(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/settings/telegram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telegramData),
      });

      if (response.ok) {
        const { status, message } = await response.json();
        updateTelegramStatus(status, message);
        alert("Telegram settings saved successfully!");
      } else {
        const error = await response.json();
        updateTelegramStatus("error", error.error || "Unknown error");
        alert(
          `Failed to save Telegram settings: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error saving Telegram settings:", error);
      updateTelegramStatus("error", "Connection error");
      alert("Error saving Telegram settings. Please try again.");
    }
  });
}

function updateTelegramStatus(status, message) {
  const telegramStatus = document.getElementById("telegram-status");
  if (!telegramStatus) return;

  telegramStatus.className = "telegram-status";

  switch (status) {
    case "connected":
      telegramStatus.classList.add("status-connected");
      telegramStatus.innerHTML = `<strong>Status:</strong> Connected and running`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
    case "error":
      telegramStatus.classList.add("status-error");
      telegramStatus.innerHTML = `<strong>Status:</strong> Error`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
    case "inactive":
    default:
      telegramStatus.classList.add("status-inactive");
      telegramStatus.innerHTML = `<strong>Status:</strong> Inactive`;
      if (message) telegramStatus.innerHTML += `<br>${message}`;
      break;
  }
}
