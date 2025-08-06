// Model provider configurations and interfaces
const { Anthropic } = require("@anthropic-ai/sdk");

class ModelProvider {
  async initialize() {
    throw new Error("Not implemented");
  }

  async generateResponse(message, conversation) {
    throw new Error("Not implemented");
  }
}

class AnthropicProvider extends ModelProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.client = null;
  }

  async initialize() {
    if (!this.apiKey) return false;
    try {
      this.client = new Anthropic({
        apiKey: this.apiKey.trim(),
      });
      return true;
    } catch (error) {
      console.error("Error initializing Anthropic client:", error);
      return false;
    }
  }

  async generateResponse(message, conversation, systemPrompt) {
    if (!this.client) throw new Error("Anthropic client not initialized");

    const maxTokens = conversation.isTelegram ? 600 : 1000;
    const response = await this.client.messages.create({
      model: "claude-3-haiku-20240307", // Fastest Anthropic model
      max_tokens: maxTokens,
      messages: [{ role: "user", content: message }],
      system: systemPrompt,
      temperature: conversation.isTelegram ? 0.5 : 0.7,
    });

    return response.content[0].text;
  }
}

class OllamaProvider extends ModelProvider {
  constructor(endpoint = "http://localhost:11434", model = "phi3:mini") {
    super();
    this.endpoint = endpoint;
    this.model = model;
  }

  async initialize() {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) return false;
      const models = await response.json();
      const modelExists =
        models.models?.some((m) => m.name === this.model) || false;
      if (modelExists) {
        console.log(`Ollama: Found required model ${this.model}`);
      } else {
        console.warn(
          `Ollama: Model ${this.model} not found. Available models:`,
          models.models?.map((m) => m.name).join(", ") || "none"
        );
      }
      return modelExists;
    } catch (error) {
      console.error("Error initializing Ollama client:", error);
      return false;
    }
  }

  async generateResponse(message, conversation, systemPrompt) {
    // Create AbortController for timeout handling - increased for demonstration
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

    try {
      // Optimize prompt for speed - shorter prompts = faster responses
      const optimizedPrompt = conversation.isTelegram
        ? `${systemPrompt.substring(0, 300)}\n\nUser: ${message}\nAssistant:` // Ultra-truncate for Telegram
        : `${systemPrompt.substring(0, 600)}\n\nUser: ${message}\nAssistant:`; // Truncate for all

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: optimizedPrompt,
          stream: false,
          options: {
            // Ultra-speed optimization options
            temperature: 0.1, // Very low temperature = much faster
            top_p: 0.5, // Reduce randomness significantly for speed
            top_k: 10, // Limit token choices aggressively for speed
            num_predict: conversation.isTelegram ? 100 : 200, // Ultra-short responses for speed
            num_ctx: 1024, // Ultra-reduced context window for speed
            repeat_penalty: 1.05,
            seed: 42, // Fixed seed for consistency and speed
            mirostat: 0, // Disable mirostat for speed
            mirostat_eta: 0.1,
            mirostat_tau: 5.0,
            num_thread: -1, // Use all available threads
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Ollama request timed out after 120 seconds");
      }
      throw error;
    }
  }
}

class TinyLlamaProvider extends ModelProvider {
  constructor(endpoint = "http://localhost:11434", model = "tinyllama") {
    super();
    this.endpoint = endpoint;
    this.model = model;
  }

  async initialize() {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (!response.ok) return false;
      const models = await response.json();
      const modelExists =
        models.models?.some((m) => m.name === this.model) || false;
      if (modelExists) {
        console.log(`TinyLlama: Found ultra-fast model ${this.model}`);
      } else {
        console.warn(
          `TinyLlama: Model ${this.model} not found. Available models:`,
          models.models?.map((m) => m.name).join(", ") || "none"
        );
      }
      return modelExists;
    } catch (error) {
      console.error("Error initializing TinyLlama client:", error);
      return false;
    }
  }

  async generateResponse(message, conversation, systemPrompt) {
    // Ultra-fast configuration - 120 second timeout for demonstration
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      // Minimal prompt for maximum speed
      const shortPrompt = conversation.isTelegram
        ? `Brief SOLess info: ${message.substring(0, 200)}`
        : `${systemPrompt.substring(0, 300)}\n\nQ: ${message}\nA:`;

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: shortPrompt,
          stream: false,
          options: {
            temperature: 0.2, // Very low for speed
            top_p: 0.7,
            top_k: 10, // Very limited for speed
            num_predict: conversation.isTelegram ? 100 : 200, // Short responses
            num_ctx: 1024, // Small context for speed
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TinyLlama API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("TinyLlama request timed out after 2 minutes");
      }
      throw error;
    }
  }
}

class ModelManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
  }

  async addProvider(name, provider) {
    const initialized = await provider.initialize();
    if (initialized) {
      this.providers.set(name, provider);
      if (!this.activeProvider) {
        this.activeProvider = name;
      }
      return true;
    }
    return false;
  }

  async setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not found`);
    }
    this.activeProvider = name;
  }

  async generateResponse(message, conversation, systemPrompt) {
    if (!this.activeProvider) {
      throw new Error("No active model provider");
    }

    const provider = this.providers.get(this.activeProvider);
    return await provider.generateResponse(message, conversation, systemPrompt);
  }

  getActiveProvider() {
    return this.activeProvider;
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

module.exports = {
  ModelManager,
  AnthropicProvider,
  OllamaProvider,
  TinyLlamaProvider,
};
