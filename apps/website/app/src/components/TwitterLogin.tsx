import { useState } from "react";
import { authApi } from "../lib/api";

interface TwitterLoginProps {
  publicKey?: string;
}

export function TwitterLoginButton({ publicKey }: TwitterLoginProps) {
  const [loading, setLoading] = useState(false);

  const handleTwitterLogin = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        `${import.meta.env.VITE_API_URL}/api/auth/twitter?wallet=${publicKey}`,
        "Twitter Login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Add event listener to handle popup close
      const checkPopup = setInterval(() => {
        const url = `${import.meta.env.VITE_API_URL}/api/auth/twitter?wallet=${publicKey}`;
        const popup = window.open(url, '_blank', 'width=600,height=600');
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Twitter login error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTwitterLogin}
      disabled={loading || !publicKey}
      className={`w-full py-2 px-4 rounded bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-medium ${
        loading || !publicKey ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Connecting..." : "Connect Twitter Account"}
    </button>
  );
}
