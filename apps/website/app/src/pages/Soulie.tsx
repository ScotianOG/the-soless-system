import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Info,
  Zap,
  MessageSquare,
  Calendar,
  HelpCircle,
  Settings,
  Users,
  Globe,
  Send,
} from "lucide-react";

// Define API service for the chatbot
const chatbotApi = {
  // Initialize a new conversation with the AI backend
  initializeConversation: async () => {
    try {
      // Use relative URL for same-origin requests, or detect environment
      const baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : `${window.location.protocol}//${window.location.hostname}`;

      // Add cache-busting parameter to bypass Cloudflare cache
      const cacheBuster = `?v=${Date.now()}`;

      const response = await fetch(
        `${baseUrl}/api/chat/conversations${cacheBuster}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.conversationId;
    } catch (error) {
      console.error("Error initializing conversation:", error);
      return null;
    }
  },

  // Send a message to the AI backend and get the response
  sendMessage: async (conversationId: string, message: string) => {
    try {
      // Use relative URL for same-origin requests, or detect environment
      const baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : `${window.location.protocol}//${window.location.hostname}`;

      // Add cache-busting parameter to bypass Cloudflare cache
      const cacheBuster = `?v=${Date.now()}`;

      // Create AbortController for optimized timeout (120 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds

      const response = await fetch(
        `${baseUrl}/api/chat/conversations/${conversationId}/messages${cacheBuster}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, I encountered an error processing your request. Please try again later.";
    }
  },
};

const SouliePage = () => {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hello! I'm Soulie, your AI assistant for the SOLess ecosystem. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize conversation when component mounts
  useEffect(() => {
    const initialize = async () => {
      const convId = await chatbotApi.initializeConversation();
      setConversationId(convId);
    };

    initialize();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || !conversationId) return;

    // Add user message
    const userMessage = {
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, userMessage]);
    const userQuery = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to AI backend
      const response = await chatbotApi.sendMessage(conversationId, userQuery);

      // Add bot response
      const botResponse = {
        type: "bot",
        content: response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error in chat flow:", error);

      // Add error message
      const errorResponse = {
        type: "bot",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black via-purple-900/30 to-black mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-10"></div>
        {/* Animated elements in the background */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-8 flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Meet{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Soulie
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              The SOLess System is a big place and it can seem complicated and
              confusing. So, we built Soulie to be with you while you travel
              around. Soulie is a custom built, cross platform, cloud based LLM
              chatbot. His knowledge bank is filled with every detail about
              SOLess and his personaliity was designed to calm and entertain
              you. No matter where you are in our community, Soulie is close by
              to help answer your questions and guide you along your way.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="w-40 h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="absolute inset-2 bg-black rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/assets/images/meet-soulie.png"
                  alt="Soulie"
                  className="w-20 h-20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-8">
        <div className="lg:col-span-2 order-1">
          <div className="bg-black/30 border border-purple-500/40 rounded-xl overflow-hidden shadow-lg h-[500px] lg:h-[600px] flex flex-col">
            {/* Chat header */}
            <div className="bg-black/50 p-4 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-purple-500/20 p-2 rounded-full mr-3">
                  <img
                    src="/assets/icons/purple-soulie-bot-36x36.png"
                    alt="Bot"
                    className="h-5 w-5"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Soulie</h2>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
              <div className="flex items-center">
                <button className="text-gray-400 hover:text-white p-1">
                  <Info className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-black/50 to-black/80">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-purple-500/20 text-white"
                        : "bg-black/50 border-l-4 border-purple-500 text-gray-200"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-purple-500/30 bg-black/60">
              <div className="flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={isLoading}
                  className="flex-1 bg-black/50 border border-purple-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !conversationId}
                  className={`${
                    isLoading
                      ? "bg-purple-700"
                      : "bg-purple-500 hover:bg-purple-600"
                  } text-white rounded-lg p-2 ml-2`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!conversationId && (
                <p className="text-xs text-red-500 mt-2">
                  Connecting to AI backend...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Capabilities Section - Hidden on mobile, shown on large screens */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 order-2">
          {/* Capabilities with Lucide icons */}
          <div className="bg-black/30 border border-purple-500/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Capabilities</h2>
            <div className="space-y-4">
              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="Platform Knowledge"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    Platform Knowledge
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Ask anything about SOLessSwap, SOLspace, and SOLarium, or our
                  community initiatives.
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="User Guidance"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    User Guidance
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Get help navigating the SOLess ecosystem and understanding our
                  features.
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="Personalized Assistance"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    Personalized Assistance
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Tailored support based on your specific needs and interests.
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="Technical Support"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    Technical Support
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Need help with technical aspects? I can guide you through
                  processes step by step.
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="Events & Updates"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    Events & Updates
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Stay informed about upcoming events, launches and promotions
                  in the SOLess ecosystem.
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                    <img
                      src="/assets/icons/logo-icon-36x36.png"
                      alt="Multi-Platform"
                      className="h-5 w-5"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white">
                    Multi-Platform
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Available across web, Telegram, and Discord with consistent
                  knowledge and personality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Details Section */}
      <div className="bg-black/30 border border-purple-500/40 rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="p-8 relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 p-3 rounded-full mr-4">
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                The Technology Behind Soulie
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-300 mb-4">
                  Soulie represents the cutting edge of our in-house AI
                  development efforts, built from the ground up to deliver a
                  truly integrated experience across the SOLess ecosystem.
                  Unlike off-the-shelf AI solutions, Soulie is entirely owned
                  and controlled by our team, allowing for unprecedented
                  customization, security, and data sovereignty.
                </p>
                <p className="text-gray-300 mb-4">
                  At its core, Soulie utilizes a hybrid architecture combining
                  local large language models with cloud-based processing
                  capabilities, optimizing for both performance and cost
                  efficiency. Our proprietary knowledge embedding system ensures
                  that Soulie maintains deep contextual understanding of the
                  SOLess ecosystem while continually learning from interactions.
                </p>
              </div>

              <div>
                <div className="bg-black/50 rounded-lg p-5 border border-purple-500/20 mb-4">
                  <h3 className="text-lg font-medium text-purple-400 mb-3">
                    Technical Features
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-purple-500/10 p-1 rounded-full mt-0.5 mr-3">
                        <Zap className="h-3 w-3 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">
                          Proprietary Document Retrieval:
                        </span>{" "}
                        Vectorized knowledge base with semantic search
                        capabilities for accurate information retrieval.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-purple-500/10 p-1 rounded-full mt-0.5 mr-3">
                        <Globe className="h-3 w-3 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">
                          Multi-Platform Integration:
                        </span>{" "}
                        Seamlessly operates across web, Telegram, and Discord
                        with consistent personality and knowledge.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-purple-500/10 p-1 rounded-full mt-0.5 mr-3">
                        <Users className="h-3 w-3 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">
                          Custom Personality Framework:
                        </span>{" "}
                        Persona engineered specifically for SOLess, maintaining
                        consistent voice and character across all interactions.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-purple-500/10 p-1 rounded-full mt-0.5 mr-3">
                        <HelpCircle className="h-3 w-3 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">
                          On-Premise Deployment:
                        </span>{" "}
                        Maintains data security through dedicated infrastructure
                        with no third-party data sharing.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-8 bg-gradient-to-r from-purple-900/30 via-purple-900/20 to-black/30 p-6 rounded-xl border border-purple-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Get Your Own Custom AI Solution
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 md:mb-0 max-w-lg">
                    Interested in having a customized AI solution for your
                    project or company? Our team can develop and deploy tailored
                    AI assistants with your brand's voice, knowledge, and
                    capabilities - available as self-managed or fully-managed
                    solutions.
                  </p>
                </div>
                <a
                  href="mailto:jtg@artistechblockchain.ca"
                  className="bg-purple-500 hover:bg-purple-600 transition-colors text-white px-6 py-3 rounded-lg flex items-center justify-center whitespace-nowrap"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact Our Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SouliePage;
