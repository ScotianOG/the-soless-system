import { useState } from "react";

interface DiscordLoginProps {
  publicKey?: string;
}

export function DiscordLoginButton({ publicKey }: DiscordLoginProps) {
  const [loading, setLoading] = useState(false);

  const handleDiscordLogin = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        `${import.meta.env.VITE_API_URL}/api/auth/discord?wallet=${publicKey}`,
        "Discord Login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Add event listener to handle popup close
      const checkPopup = setInterval(() => {
        const popup = window.open(
          `${import.meta.env.VITE_API_URL}/api/auth/discord?wallet=${publicKey}`,
          '_blank',
          'width=600,height=800'
        );
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Discord login error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={loading || !publicKey}
      className={`w-full py-2 px-4 rounded bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium ${
        loading || !publicKey ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Connecting..." : "Connect Discord Account"}
    </button>
  );
}
