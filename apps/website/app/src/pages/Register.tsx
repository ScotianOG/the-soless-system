import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { registrationApi, verificationApi, usersApi } from "../lib/api";
import type { ServerVerificationStatus } from "../lib/api/verification";
import GuidedRegister from "../components/GuidedRegister";

interface PlatformStatus {
  linked: boolean;
  username?: string;
  verificationCode?: string;
}

interface PlatformStatuses {
  telegram: PlatformStatus;
  discord: PlatformStatus;
  twitter: PlatformStatus;
}

export default function Register() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const hasCheckedRegistration = useRef(false);
  const isCheckingRegistration = useRef(false);
  const lastCheckedWallet = useRef<string | null>(null);

  const [platforms, setPlatforms] = useState<{
    telegram: { linked: boolean; username?: string; verificationCode?: string };
    discord: { linked: boolean; username?: string; verificationCode?: string };
    twitter: { linked: boolean; username?: string; verificationCode?: string };
  }>({
    telegram: { linked: false },
    discord: { linked: false },
    twitter: { linked: false },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({
    telegram: false,
    discord: false,
    twitter: false,
    registration: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Clear wallet address from localStorage when wallet is disconnected
  useEffect(() => {
    if (!connected) {
      localStorage.removeItem("walletAddress");
    }
  }, [connected]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!publicKey) {
        setLoading(false);
        hasCheckedRegistration.current = false;
        return;
      }

      const walletAddress = publicKey.toString();

      // Prevent multiple calls for the same wallet
      if (
        isCheckingRegistration.current ||
        lastCheckedWallet.current === walletAddress ||
        hasCheckedRegistration.current
      ) {
        return;
      }

      isCheckingRegistration.current = true;
      lastCheckedWallet.current = walletAddress;

      try {
        console.log(
          "Checking registration for wallet:",
          walletAddress.substring(0, 10) + "..."
        );

        // Store wallet address for API requests
        localStorage.setItem("walletAddress", walletAddress);

        const user = await usersApi.getUser(walletAddress);

        if (user) {
          // Check if user has verified any platforms
          const hasVerifiedPlatform =
            user.platforms &&
            Object.values(user.platforms).some((platform) => platform.verified);

          if (hasVerifiedPlatform) {
            console.log(
              "User has verified platforms, redirecting to community"
            );
            // User is fully registered with verified platforms
            navigate("/community");
            return;
          }
          console.log("User exists but no verified platforms");
          // If user exists but has no verified platforms, stay on register page
        } else {
          console.log("User not found, staying on register page");
        }

        // Check current verification status for all platforms
        try {
          const verificationStatus = await verificationApi.getStatus(
            walletAddress
          );
          setPlatforms((prev) => ({
            telegram: {
              ...prev.telegram,
              linked: verificationStatus.telegram,
              username: verificationStatus.accounts?.telegram?.username,
            },
            discord: {
              ...prev.discord,
              linked: verificationStatus.discord,
              username: verificationStatus.accounts?.discord?.username,
            },
            twitter: {
              ...prev.twitter,
              linked: verificationStatus.twitter,
              username: verificationStatus.accounts?.twitter?.username,
            },
          }));
        } catch (verificationError) {
          console.log(
            "Could not fetch verification status, proceeding with default state"
          );
        }

        hasCheckedRegistration.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Registration check error:", error);
        // For new users (404) or network errors, just let them proceed with registration
        hasCheckedRegistration.current = true;
        setLoading(false);

        // Only show error for unexpected errors (not 404 or 429)
        if (
          error instanceof Error &&
          !error.message.includes("404") &&
          !error.message.includes("429")
        ) {
          console.error("Error checking registration:", error);
          setError(`Error checking registration status: ${error.message}`);
        }
      } finally {
        isCheckingRegistration.current = false;
      }
    };

    // Only run if we haven't already checked for this wallet
    if (!hasCheckedRegistration.current) {
      checkRegistration();
    }
  }, [publicKey, navigate]);

  const generateVerificationCode = async (platform: keyof PlatformStatuses) => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setSubmitting((prev) => ({ ...prev, [platform]: true }));
      const { code } = await verificationApi.generateCode(
        publicKey.toString(),
        platform
      );
      setPlatforms((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          verificationCode: code,
        },
      }));

      // Start polling for verification status
      startVerificationCheck(platform);
    } catch (error) {
      console.error(`Error generating ${platform} verification code:`, error);

      // Check if this is an "already verified" error
      if (
        error instanceof Error &&
        error.message.includes("already verified")
      ) {
        // Update the platform status to show it's already linked
        setPlatforms((prev) => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            linked: true,
          },
        }));
        setError(`You have already verified your ${platform} account.`);
      } else {
        setError(
          `Failed to generate ${platform} verification code: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      setSubmitting((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const startVerificationCheck = async (platform: keyof PlatformStatuses) => {
    const checkInterval = setInterval(async () => {
      if (!publicKey) return;

      try {
        const status = await verificationApi.getStatus(publicKey.toString());
        const isVerified =
          status[platform.toLowerCase() as keyof typeof status];
        const accountInfo =
          status.accounts?.[
            platform.toLowerCase() as keyof typeof status.accounts
          ];

        if (isVerified && accountInfo) {
          setPlatforms((prev) => ({
            ...prev,
            [platform]: {
              ...prev[platform],
              linked: true,
              username: accountInfo.username || accountInfo.platformId,
            },
          }));
          clearInterval(checkInterval);
        }
      } catch (error) {
        // Ignore 404s during verification check
        if (!(error instanceof Error && error.message.includes("404"))) {
          console.error(`Error checking ${platform} verification:`, error);
        }
      }
    }, 5000); // Check every 5 seconds

    // Clear interval after 5 minutes
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
    }, 300000);

    // Cleanup both interval and timeout on component unmount
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setSubmitting((prev) => ({ ...prev, registration: true }));
    setError("");

    try {
      await registrationApi.register({
        wallet: publicKey.toString(),
        platforms,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/community");
      }, 2000);
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setSubmitting((prev) => ({ ...prev, registration: false }));
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} retry={() => setError("")} />;

  return (
    <GuidedRegister
      publicKey={publicKey?.toString() || null}
      generateVerificationCode={(platform: string) =>
        generateVerificationCode(platform as keyof PlatformStatuses)
      }
      handleSubmit={handleSubmit}
      platforms={platforms}
      setPlatforms={setPlatforms}
      submitting={{
        telegram: submitting.telegram,
        discord: submitting.discord,
        twitter: submitting.twitter,
        registration: submitting.registration,
      }}
      success={success}
    />
  );
}
