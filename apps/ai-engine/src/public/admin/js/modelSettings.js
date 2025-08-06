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
