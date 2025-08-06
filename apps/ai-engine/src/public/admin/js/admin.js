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

  // Model Settings Elements
  const modelForm = document.getElementById("model-form");

  // Initialize functionality based on what elements exist on the page
  if (chatContainer) initializeChat();
  if (uploadForm) initializeDocumentUpload();
  if (widgetCodeBox) initializeIntegration();
  if (personaForm) initializePersonaSettings();
  if (telegramForm) initializeTelegramSettings();
  if (modelForm) initializeModelSettings();

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
      updateSelectedFiles();
    });
  }

  // Handle form submission
  const uploadForm = document.getElementById("upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleDocumentUpload);
  }

  // Handle GitHub repository form submission
  const githubForm = document.getElementById("github-form");
  if (githubForm) {
    githubForm.addEventListener("submit", handleGithubRepoLoad);
  }

  // Initialize file selection controls
  initializeFileSelectionControls();
}

// Show list of selected files
function updateSelectedFiles() {
  const fileInput = document.getElementById("document");
  const selectedFilesContainer = document.getElementById("selected-files");

  if (fileInput && selectedFilesContainer) {
    // Clear previously selected files display
    selectedFilesContainer.innerHTML = "";

    if (fileInput.files.length > 0) {
      // Show selected files
      Array.from(fileInput.files).forEach((file, index) => {
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
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Handle document upload
async function handleDocumentUpload(e) {
  e.preventDefault();

  const fileInput = document.getElementById("document");
  if (!fileInput.files.length) {
    alert("Please select one or more files to upload");
    return;
  }

  const formData = new FormData();

  // Support multiple file uploads
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append("documents", fileInput.files[i]);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message || "Upload successful!");
      fileInput.value = "";
      document.getElementById("selected-files").innerHTML = "";
      loadDocuments();
    } else {
      const error = await response.json();
      alert(`Upload failed: ${error.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error uploading document:", error);
    alert("Error uploading document. Please try again.");
  }
}

// Handle GitHub repository loading
async function handleGithubRepoLoad(e) {
  e.preventDefault();

  const repoInput = document.getElementById("repository");
  const repository = repoInput.value.trim();

  if (!repository || !repository.includes("/")) {
    alert("Please enter a valid repository in the format owner/repo");
    return;
  }

  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : "Submit";
  if (submitButton) {
    submitButton.textContent = "Loading...";
    submitButton.disabled = true;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 93750); // 93.75 seconds timeout (increased by 25% from 75s)

  try {
    console.log(`Loading repository structure for: ${repository}`);
    const response = await fetch(`${apiBaseUrl}/documents/github/structure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repository }),
      signal: controller.signal,
      credentials: "same-origin",
      keepalive: true,
      cache: "no-cache",
    });

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
    let errorMessage;
    if (error.name === "AbortError") {
      errorMessage =
        "Request timed out - repository might be too large or connection is slow. Please try again or select a smaller repository.";
    } else if (error.message.includes("GitHub API")) {
      errorMessage = `GitHub API error: Please check your GitHub token and repository permissions. ${error.message}`;
    } else if (error.message.includes("404")) {
      errorMessage =
        "Repository not found. Please check the owner/repo name and make sure the repository is public or your token has access to it.";
    } else {
      errorMessage = `Failed to load repository: ${
        error.message || "Connection error - please try again"
      }`;
    }
    alert(errorMessage);
  } finally {
    clearTimeout(timeoutId);
    if (submitButton) {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  }
}

// Toggle directory expansion
function toggleDirectory(header) {
  const content = header.nextElementSibling;
  const toggle = header.querySelector(".directory-toggle");

  if (content.style.display === "none") {
    content.style.display = "block";
    toggle.textContent = "▼";
  } else {
    content.style.display = "none";
    toggle.textContent = "▶";
  }
}

function displayFileTree(files) {
  const container = document.getElementById("repo-files");
  if (!container) return;

  // Add CSS styles for the file tree
  const style = document.createElement("style");
  style.textContent = `
    .file-tree-list {
      list-style: none;
      padding-left: 20px;
      margin: 0;
    }
    .directory-header {
      cursor: pointer;
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .directory-header:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .directory-toggle {
      display: inline-block;
      width: 16px;
      text-align: center;
      user-select: none;
    }
    .directory-name {
      margin-right: 5px;
    }
    .file-item {
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-left: 21px;
    }
    .file-name {
      margin-right: 5px;
    }
    .file-size {
      color: #666;
      font-size: 0.9em;
    }
    .documentation-file .file-name {
      color: #0066cc;
    }
  `;
  document.head.appendChild(style);

  container.innerHTML = "";

  // Sort files by path
  files.sort((a, b) => a.path.localeCompare(b.path));

  // Group files by directory
  const fileTree = {};

  files.forEach((file) => {
    if (!file || !file.path) {
      console.warn("Invalid file object found:", file);
      return; // Skip invalid file objects
    }

    const parts = file.path.split("/");
    if (parts.length === 0) {
      console.warn("Invalid file path (empty after split):", file.path);
      return;
    }

    let current = fileTree;

    // Create directory structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) {
        console.warn("Empty path segment found in:", file.path);
        continue;
      }

      if (!current[part]) {
        current[part] = { __files: [] }; // Initialize with __files array
      } else if (!current[part].__files) {
        current[part].__files = []; // Ensure __files exists
      }
      current = current[part];
    }

    // Add file to its directory
    if (current && Array.isArray(current.__files)) {
      const fileName = parts[parts.length - 1];
      if (fileName) {
        current.__files.push({
          name: fileName,
          path: file.path,
          size: file.size || 0,
          type: file.type || "file",
        });
      }
    }
  });

  // Render the file tree
  container.innerHTML = renderFileTree(fileTree);

  // Add checkbox event listeners
  setupCheckboxListeners();
}

// Render the file tree structure
function renderFileTree(tree, path = "") {
  let html = '<ul class="file-tree-list">';

  // First, render all directories
  Object.keys(tree)
    .filter((key) => key !== "__files")
    .forEach((dir) => {
      const dirPath = path ? `${path}/${dir}` : dir;

      html += `
      <li class="directory">
        <div class="directory-header" onclick="toggleDirectory(this)">
          <span class="directory-toggle">▶</span>
          <input type="checkbox" class="directory-checkbox" data-path="${dirPath}" onclick="event.stopPropagation();" />
          <span class="directory-name">${dir}/</span>
        </div>
        <div class="directory-content" style="display: none;">
          ${renderFileTree(tree[dir], dirPath)}
        </div>
      </li>
    `;
    });

  // Then, render all files in this directory
  if (tree.__files && tree.__files.length > 0) {
    tree.__files.forEach((file) => {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const isDocumentation =
        fileExt === "md" ||
        fileExt === "txt" ||
        file.name.toLowerCase().includes("readme") ||
        file.name.toLowerCase().includes("docs");

      html += `
        <li class="file ${isDocumentation ? "documentation-file" : ""}">
          <div class="file-item">
            <input type="checkbox" class="file-checkbox" data-path="${
              file.path
            }" data-is-doc="${isDocumentation}" />
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
          </div>
        </li>
      `;
    });
  }

  html += "</ul>";
  return html;
}

// Setup checkbox listeners for parent-child selection
function setupCheckboxListeners() {
  // Directory checkbox affects all children
  document.querySelectorAll(".directory-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const path = this.getAttribute("data-path");
      const checked = this.checked;

      // Find all checkboxes for files within this directory
      const childCheckboxes = document.querySelectorAll(
        `.file-checkbox[data-path^="${path}/"]`
      );
      childCheckboxes.forEach((childBox) => {
        childBox.checked = checked;
      });

      // Also affect subdirectory checkboxes
      const childDirCheckboxes = document.querySelectorAll(
        `.directory-checkbox[data-path^="${path}/"]`
      );
      childDirCheckboxes.forEach((childDirBox) => {
        childDirBox.checked = checked;
      });
    });
  });
}

function initializeFileSelectionControls() {
  const selectAll = document.getElementById("select-all");
  const selectDocs = document.getElementById("select-docs");
  const importSelected = document.getElementById("import-selected");

  if (selectAll) {
    selectAll.addEventListener("click", selectAllFiles);
  }

  if (selectDocs) {
    selectDocs.addEventListener("click", selectDocumentationFiles);
  }

  if (importSelected) {
    importSelected.addEventListener("click", importSelectedFiles);
  }
}

// Select all files
function selectAllFiles() {
  document
    .querySelectorAll(".file-checkbox, .directory-checkbox")
    .forEach((checkbox) => {
      checkbox.checked = true;
    });
}

// Select only documentation files
function selectDocumentationFiles() {
  // First uncheck all
  document
    .querySelectorAll(".file-checkbox, .directory-checkbox")
    .forEach((checkbox) => {
      checkbox.checked = false;
    });

  // Then check only documentation files
  document
    .querySelectorAll('.file-checkbox[data-is-doc="true"]')
    .forEach((checkbox) => {
      checkbox.checked = true;
    });

  // Also check readme files, markdown files, and TypeScript definition files
  document.querySelectorAll(".file-checkbox").forEach((checkbox) => {
    const path = checkbox.getAttribute("data-path").toLowerCase();
    if (
      path.includes("readme") ||
      path.includes("/docs/") ||
      path.endsWith(".md") ||
      path.endsWith(".markdown") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx") ||
      path.includes("documentation") ||
      path.includes("types/")
    ) {
      checkbox.checked = true;
    }
  });
}

// Import selected files
async function importSelectedFiles() {
  // Get all checked checkboxes (both files and directories)
  const checkedBoxes = document.querySelectorAll(
    "#repo-files input[type=checkbox]:checked"
  );

  // Filter out directory checkboxes and get paths
  const selectedFiles = Array.from(checkedBoxes)
    .filter((cb) => cb.classList.contains("file-checkbox"))
    .map((cb) => cb.dataset.path)
    .filter(Boolean); // Remove any undefined or empty paths

  console.log("Selected files to import:", selectedFiles); // Debug log

  if (selectedFiles.length === 0) {
    alert("Please select at least one file to import");
    return;
  }

  if (selectedFiles.length > 100) {
    alert("Too many files selected. Please select fewer files (maximum 100).");
    return;
  }

  // Show loading state
  const importButton = document.getElementById("import-selected");
  const originalButtonText = importButton
    ? importButton.textContent
    : "Import Selected";
  if (importButton) {
    importButton.textContent = "Importing...";
    importButton.disabled = true;
  }

  try {
    if (!repoInfo || !repoInfo.owner || !repoInfo.repo) {
      throw new Error(
        "Repository information is missing. Please reload the repository."
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes timeout

    // Debug log the request payload
    const payload = {
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      files: selectedFiles,
    };
    console.log("Sending request payload:", payload);

    const response = await fetch(`${apiBaseUrl}/documents/github/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      signal: controller.signal,
      keepalive: true,
    });

    try {
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
      await loadDocuments(); // Load documents first to ensure the list is updated
      alert(
        result.message || `Successfully imported ${selectedFiles.length} files!`
      );
      // Don't hide the file list or clear repo info to maintain the UI state
      // document.getElementById("github-file-list").style.display = "none";
      // document.getElementById("repository").value = "";
      // repoFiles = [];
      // repoInfo = null;
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
  } finally {
    if (importButton) {
      importButton.textContent = originalButtonText;
      importButton.disabled = false;
    }
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

/**
 * Model Settings Functionality
 */
async function initializeModelSettings() {
  const modelForm = document.getElementById("model-form");
  const modelStatus = document.getElementById("model-status");
  const modelSelect = document.getElementById("model-provider");

  try {
    // Fetch current model settings
    const response = await fetch(`${apiBaseUrl}/settings/model`);
    if (!response.ok) {
      throw new Error("Failed to fetch model settings");
    }

    const { activeProvider, availableProviders } = await response.json();

    // Update status display
    modelStatus.innerHTML = `
      <div class="status-item">
        <strong>Active Provider:</strong> ${activeProvider || "None"}
      </div>
      <div class="status-item">
        <strong>Available Providers:</strong> ${availableProviders.join(", ")}
      </div>
    `;

    // Populate provider select
    modelSelect.innerHTML = availableProviders
      .map(
        (provider) =>
          `<option value="${provider}" ${
            provider === activeProvider ? "selected" : ""
          }>
        ${provider.charAt(0).toUpperCase() + provider.slice(1)}
       </option>`
      )
      .join("");
  } catch (error) {
    console.error("Error loading model settings:", error);
    modelStatus.innerHTML =
      '<div class="error">Error loading model settings</div>';
  }

  // Handle form submission
  modelForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const provider = modelSelect.value;
    if (!provider) {
      alert("Please select a provider");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/settings/model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error("Failed to update model settings");
      }

      const result = await response.json();
      if (result.success) {
        alert("Model settings updated successfully!");
        // Refresh the status display
        initializeModelSettings();
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error saving model settings:", error);
      alert(`Failed to update model settings: ${error.message}`);
    }
  });
}
