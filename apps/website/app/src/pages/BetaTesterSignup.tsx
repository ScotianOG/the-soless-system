import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Users,
  TestTube,
  Send,
  CheckCircle,
  AlertCircle,
  Twitter,
  MessageSquare,
  Wallet,
} from "lucide-react";

interface FormData {
  solanaAddress: string;
  sonicAddress: string;
  telegramUsername: string;
  twitterHandle: string;
}

const BetaTesterSignup = () => {
  const { publicKey, connected } = useWallet();
  const [formData, setFormData] = useState<FormData>({
    solanaAddress: "",
    sonicAddress: "",
    telegramUsername: "",
    twitterHandle: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Auto-fill Solana address when wallet is connected
  React.useEffect(() => {
    if (connected && publicKey) {
      setFormData((prev) => ({
        ...prev,
        solanaAddress: publicKey.toString(),
      }));
    }
  }, [connected, publicKey]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.solanaAddress.trim()) {
      newErrors.solanaAddress = "Solana address is required";
    } else if (
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.solanaAddress.trim())
    ) {
      newErrors.solanaAddress = "Invalid Solana address format";
    }

    if (!formData.sonicAddress.trim()) {
      newErrors.sonicAddress = "Sonic address is required";
    }

    if (!formData.telegramUsername.trim()) {
      newErrors.telegramUsername = "Telegram username is required";
    } else if (!formData.telegramUsername.startsWith("@")) {
      newErrors.telegramUsername = "Telegram username should start with @";
    }

    if (!formData.twitterHandle.trim()) {
      newErrors.twitterHandle = "Twitter handle is required";
    } else if (!formData.twitterHandle.startsWith("@")) {
      newErrors.twitterHandle = "Twitter handle should start with @";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("http://localhost:3001/beta/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        // Reset form
        setFormData({
          solanaAddress: connected && publicKey ? publicKey.toString() : "",
          sonicAddress: "",
          telegramUsername: "",
          twitterHandle: "",
        });
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting beta signup:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center">
            <div className="max-w-3xl flex-1">
              <h1 className="text-4xl font-bold mb-4 text-white">
                SOLess{" "}
                <span className="text-soless-blue">Beta Tester Sign-Up</span>
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Be among the first to experience the SOLess System beta launch
                on June 13, 2025. Join our exclusive beta testing program and
                help shape the future of DeFi.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center mb-12">
                <Link
                  to="https://t.me/SolessSystem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <MessageSquare className="h-5 w-5" />
                  Join Telegram
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  to="https://twitter.com/SolessSystem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <Twitter className="h-5 w-5" />
                  Follow Twitter
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/briefcase.png"
                alt="Founder's Club"
                className="h-64 w-auto transition-opacity duration-3000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Beta Program Features */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-black/40 backdrop-blur-lg border border-soless-blue/30 rounded-xl p-6 text-center">
            <div className="bg-soless-blue/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-soless-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Early Access
            </h3>
            <p className="text-gray-300">
              Get exclusive access to SOLess Swap, SOLspace, and SOLarium before
              public launch
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6 text-center">
            <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TestTube className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Shape the Future
            </h3>
            <p className="text-gray-300">
              Your feedback will directly influence the final product and user
              experience
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6 text-center">
            <div className="bg-cyan-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Exclusive Rewards
            </h3>
            <p className="text-gray-300">
              Beta testers receive special NFTs, priority access to future
              features and recognition on SOLspace
            </p>
          </div>
        </div>

        {/* Sign-up Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-soless-blue/40 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-soless-blue mb-2">
                Join the Beta Program
              </h2>
              <p className="text-gray-300">
                Fill in your details to secure your spot in the beta testing
                program
              </p>
            </div>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300">
                  Successfully submitted! We'll contact you soon with beta
                  access details.
                </span>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-300">
                  Failed to submit your application. Please try again.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Solana Address */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Solana Devnet Wallet Address *
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.solanaAddress}
                    onChange={(e) =>
                      handleInputChange("solanaAddress", e.target.value)
                    }
                    placeholder="Your Solana devnet wallet address"
                    className={`w-full pl-10 pr-4 py-3 bg-black/70 border ${
                      errors.solanaAddress
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-soless-blue focus:ring-1 focus:ring-soless-blue/50 transition-all`}
                    disabled={connected && !!publicKey}
                  />
                  {connected && publicKey && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                </div>
                {errors.solanaAddress && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.solanaAddress}
                  </p>
                )}
                {connected && publicKey && (
                  <p className="mt-1 text-sm text-green-400">
                    ✓ Connected wallet address auto-filled
                  </p>
                )}
              </div>

              {/* Sonic Address */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Sonic Testnet Wallet Address *
                </label>

                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.sonicAddress}
                    onChange={(e) =>
                      handleInputChange("sonicAddress", e.target.value)
                    }
                    placeholder="Your Sonic testnet address"
                    className={`w-full pl-10 pr-4 py-3 bg-black/70 border ${
                      errors.sonicAddress ? "border-red-500" : "border-gray-600"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-soless-blue focus:ring-1 focus:ring-soless-blue/50 transition-all`}
                  />
                  {errors.sonicAddress && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.sonicAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Telegram Username */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Telegram Username *
                </label>
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.telegramUsername}
                    onChange={(e) =>
                      handleInputChange("telegramUsername", e.target.value)
                    }
                    placeholder="@yourusername"
                    className={`w-full pl-10 pr-4 py-3 bg-black/70 border ${
                      errors.telegramUsername
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-soless-blue focus:ring-1 focus:ring-soless-blue/50 transition-all`}
                  />
                </div>
                {errors.telegramUsername && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.telegramUsername}
                  </p>
                )}
              </div>

              {/* Twitter Handle */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Twitter Handle *
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.twitterHandle}
                    onChange={(e) =>
                      handleInputChange("twitterHandle", e.target.value)
                    }
                    placeholder="@yourusername"
                    className={`w-full pl-10 pr-4 py-3 bg-black/70 border ${
                      errors.twitterHandle
                        ? "border-red-500"
                        : "border-gray-600"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-soless-blue focus:ring-1 focus:ring-soless-blue/50 transition-all`}
                  />
                </div>
                {errors.twitterHandle && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.twitterHandle}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-soless-blue to-purple-500 hover:from-soless-blue/90 hover:to-purple-500/90 hover:shadow-lg hover:shadow-purple-500/25"
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    Join Beta Program
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-gray-400 text-sm">
              <p>
                By signing up, you agree to participate in beta testing and
                provide feedback.
                <br />
                All beta participants will receive exclusive rewards and early
                access benefits.
              </p>
            </div>
          </div>
        </div>

        {/* Launch Timeline */}
        <div className="mt-16 text-center">
          <div className="bg-black/40 backdrop-blur-lg border border-soless-blue/30 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-soless-blue mb-4">
              Beta Launch Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  June 13
                </div>
                <div className="text-lg font-semibold text-white mb-1">
                  Closed Beta
                </div>
                <div className="text-gray-300 text-sm">
                  Selected beta testers get early access
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  Phase 2
                </div>
                <div className="text-lg font-semibold text-white mb-1">
                  Open Beta
                </div>
                <div className="text-gray-300 text-sm">
                  Expanded access with all features
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  Phase 3
                </div>
                <div className="text-lg font-semibold text-white mb-1">
                  Public Launch
                </div>
                <div className="text-gray-300 text-sm">
                  Full ecosystem goes live
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaTesterSignup;
