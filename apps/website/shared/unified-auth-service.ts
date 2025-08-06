/**
 * SOLess Unified Platform - Cross-Subdomain Authentication Service
 * Handles authentication state across all subdomains in the SOLess ecosystem
 */

interface PlatformConfig {
  name: string;
  url: string;
  description: string;
  features: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  wallet: string | null;
  userData: any;
  platforms: string[];
  lastActivity: Date;
}

class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private authState: AuthState | null = null;
  private platforms: Map<string, PlatformConfig> = new Map();

  private constructor() {
    this.initializePlatforms();
    this.setupCrossSubdomainAuth();
  }

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  private initializePlatforms() {
    this.platforms.set("hub", {
      name: "SOLess Hub",
      url: "https://soless.app",
      description: "Central dashboard and platform launcher",
      features: ["dashboard", "analytics", "platform_launcher", "contests"],
    });

    this.platforms.set("solspace", {
      name: "SOLspace",
      url: "https://solspace.soless.app",
      description: "Social platform for viral content and NFT minting",
      features: [
        "social_feed",
        "nft_minting",
        "content_creation",
        "viral_detection",
      ],
    });

    this.platforms.set("swap", {
      name: "SOLess Swap",
      url: "https://swap.soless.app",
      description: "Token-2022 AMM with burn mechanisms",
      features: [
        "token_swapping",
        "liquidity_pools",
        "token_creation",
        "burn_tracking",
      ],
    });

    this.platforms.set("solarium", {
      name: "SOLarium",
      url: "https://solarium.soless.app",
      description: "NFT marketplace with vault features",
      features: [
        "nft_marketplace",
        "vault_storage",
        "floor_price_guarantee",
        "collection_management",
      ],
    });

    this.platforms.set("ai", {
      name: "Soulie AI",
      url: "https://ai.soless.app",
      description: "AI assistant and knowledge base",
      features: [
        "chat_assistance",
        "platform_guidance",
        "documentation_search",
        "smart_recommendations",
      ],
    });
  }

  private setupCrossSubdomainAuth() {
    // Listen for authentication events from other subdomains
    window.addEventListener("message", (event) => {
      const allowedOrigins = [
        "https://soless.app",
        "https://solspace.soless.app",
        "https://swap.soless.app",
        "https://solarium.soless.app",
        "https://ai.soless.app",
        "https://auth.soless.app",
      ];

      if (allowedOrigins.includes(event.origin)) {
        this.handleCrossSubdomainMessage(event.data);
      }
    });

    // Check for existing authentication state
    this.loadAuthState();
  }

  private handleCrossSubdomainMessage(data: any) {
    switch (data.type) {
      case "AUTH_STATE_UPDATE":
        this.updateAuthState(data.authState);
        break;
      case "LOGOUT":
        this.logout();
        break;
      case "PLATFORM_SWITCH":
        this.handlePlatformSwitch(data.platform, data.context);
        break;
    }
  }

  private loadAuthState() {
    try {
      const savedState = localStorage.getItem("soless_unified_auth");
      if (savedState) {
        this.authState = JSON.parse(savedState);
        this.validateAuthState();
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      this.clearAuthState();
    }
  }

  private saveAuthState() {
    if (this.authState) {
      localStorage.setItem(
        "soless_unified_auth",
        JSON.stringify(this.authState)
      );
    }
  }

  private validateAuthState() {
    if (this.authState) {
      // Check if auth state is still valid (e.g., not expired)
      const now = new Date();
      const lastActivity = new Date(this.authState.lastActivity);
      const hoursSinceActivity =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActivity > 24) {
        // Auth state expired, clear it
        this.clearAuthState();
      }
    }
  }

  private updateAuthState(newState: AuthState) {
    this.authState = {
      ...newState,
      lastActivity: new Date(),
    };
    this.saveAuthState();
    this.broadcastAuthUpdate();
  }

  private clearAuthState() {
    this.authState = null;
    localStorage.removeItem("soless_unified_auth");
    this.broadcastAuthUpdate();
  }

  private broadcastAuthUpdate() {
    // Broadcast auth state to all subdomains
    const message = {
      type: "AUTH_STATE_UPDATE",
      authState: this.authState,
    };

    this.platforms.forEach((platform) => {
      if (platform.url !== window.location.origin) {
        this.postMessageToSubdomain(platform.url, message);
      }
    });
  }

  private postMessageToSubdomain(targetOrigin: string, message: any) {
    // Create a temporary iframe to send message to subdomain
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `${targetOrigin}/auth-bridge.html`;

    iframe.onload = () => {
      iframe.contentWindow?.postMessage(message, targetOrigin);
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };

    document.body.appendChild(iframe);
  }

  // Public API methods

  async authenticate(
    walletAddress: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Verify signature and authenticate with backend
      const response = await fetch("https://auth.soless.app/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: walletAddress,
          signature: signature,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        const userData = await response.json();

        this.updateAuthState({
          isAuthenticated: true,
          wallet: walletAddress,
          userData: userData,
          platforms: Array.from(this.platforms.keys()),
          lastActivity: new Date(),
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }

  logout() {
    this.clearAuthState();

    // Redirect to main hub
    if (window.location.hostname !== "soless.app") {
      window.location.href = "https://soless.app";
    }
  }

  isAuthenticated(): boolean {
    return this.authState?.isAuthenticated || false;
  }

  getWalletAddress(): string | null {
    return this.authState?.wallet || null;
  }

  getUserData(): any {
    return this.authState?.userData || null;
  }

  getPlatforms(): PlatformConfig[] {
    return Array.from(this.platforms.values());
  }

  getCurrentPlatform(): string {
    const hostname = window.location.hostname;

    if (hostname === "soless.app") return "hub";
    if (hostname === "solspace.soless.app") return "solspace";
    if (hostname === "swap.soless.app") return "swap";
    if (hostname === "solarium.soless.app") return "solarium";
    if (hostname === "ai.soless.app") return "ai";

    return "unknown";
  }

  navigateToPlatform(platformKey: string, context?: any) {
    const platform = this.platforms.get(platformKey);
    if (platform) {
      // Store navigation context
      if (context) {
        sessionStorage.setItem("soless_nav_context", JSON.stringify(context));
      }

      // Navigate to platform
      window.location.href = platform.url;
    }
  }

  getNavigationContext(): any {
    try {
      const context = sessionStorage.getItem("soless_nav_context");
      if (context) {
        sessionStorage.removeItem("soless_nav_context");
        return JSON.parse(context);
      }
    } catch (error) {
      console.error("Error reading navigation context:", error);
    }
    return null;
  }

  private handlePlatformSwitch(platform: string, context: any) {
    this.navigateToPlatform(platform, context);
  }

  // Platform-specific feature availability
  isPlatformFeatureAvailable(feature: string): boolean {
    const currentPlatform = this.getCurrentPlatform();
    const platform = this.platforms.get(currentPlatform);
    return platform?.features.includes(feature) || false;
  }

  // Cross-platform analytics tracking
  trackActivity(activity: string, metadata?: any) {
    if (this.authState) {
      fetch("https://analytics.soless.app/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          wallet: this.authState.wallet,
          platform: this.getCurrentPlatform(),
          activity: activity,
          metadata: metadata,
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.error("Analytics tracking error:", error);
      });
    }
  }

  private getAuthToken(): string | null {
    // Return JWT token for authenticated requests
    return this.authState?.userData?.token || null;
  }
}

// Global instance
export const unifiedAuth = UnifiedAuthService.getInstance();

// Export for use in other modules
export default UnifiedAuthService;
