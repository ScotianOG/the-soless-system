import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitter,
  Search,
  TrendingUp,
  Zap,
  Award,
  Wallet,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  BarChart3,
  MessageCircle,
  Heart,
  Repeat,
} from "lucide-react";

// StarryBackground component
const StarryBackground = ({ starCount = 200 }: { starCount?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Star data
    let stars: {
      x: number;
      y: number;
      size: number;
      speed: number;
      brightness: number;
    }[] = [];

    // Create stars
    const createStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.1,
          speed: Math.random() * 0.05,
          brightness: Math.random() * 0.5 + 0.5,
        });
      }
    };

    // Draw stars
    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Optional: Draw background gradient
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3,
        canvas.height * 0.4,
        0,
        canvas.width * 0.3,
        canvas.height * 0.4,
        canvas.width * 0.8,
      );
      gradient.addColorStop(0, "rgba(76, 0, 255, 0.03)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.7,
        canvas.height * 0.6,
        0,
        canvas.width * 0.7,
        canvas.height * 0.6,
        canvas.width * 0.8,
      );
      gradient2.addColorStop(0, "rgba(0, 198, 255, 0.03)");
      gradient2.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      }
    };

    // Set canvas dimensions
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createStars();
      drawStars();
    };

    // Animate stars
    const animateStars = () => {
      for (const star of stars) {
        star.brightness = 0.5 + Math.sin(Date.now() * star.speed) * 0.2;
        star.size = Math.max(0.1, Math.random() * 2 + Math.sin(Date.now() * star.speed) * 0.5);
      }

      drawStars();
      requestAnimationFrame(animateStars);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    animateStars();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-black pointer-events-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
};

// Custom Button component
const Button = ({ 
  variant = "primary", 
  size = "md", 
  children, 
  className = "", 
  onClick, 
  ...props 
}: { 
  variant?: "primary" | "outline" | "secondary"; 
  size?: "sm" | "md" | "lg" | "icon"; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  [key: string]: any;
}) => {
  const baseStyles = "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-soless-blue/50 focus:ring-offset-2 focus:ring-offset-black";
  
  const variantStyles = {
    primary: "bg-soless-blue hover:bg-soless-blue/80 text-white",
    secondary: "bg-black/50 hover:bg-black/70 text-gray-300",
    outline: "bg-transparent border border-gray-700 text-gray-400 hover:bg-black/20"
  };
  
  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default function SolspaceVisualization() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    {
      id: 0,
      title: "Social Media Monitoring",
      description: "SOLspace continuously monitors social media platforms for content with high engagement potential.",
      icon: <Twitter className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 1,
      title: "Viral Detection Algorithm",
      description:
        "Our algorithm analyzes engagement metrics, growth rate, and content quality to identify viral posts.",
      icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
      color: "from-purple-500 to-blue-500",
    },
    {
      id: 2,
      title: "Automatic NFT Minting",
      description:
        "When a post reaches viral status, SOLspace automatically mints it as an NFT on the SONIC blockchain.",
      icon: <Zap className="h-6 w-6 text-amber-400" />,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: 3,
      title: "Creator Notification",
      description:
        "The original content creator receives a notification that their viral post has been preserved as an NFT.",
      icon: <MessageCircle className="h-6 w-6 text-green-400" />,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      title: "NFT Claiming",
      description: "Creators can connect their wallet and verify ownership to claim their viral post NFT.",
      icon: <Wallet className="h-6 w-6 text-cyan-400" />,
      color: "from-cyan-500 to-blue-500",
    },
  ];

  const startAutoPlay = () => {
    setIsAutoPlaying(true);
    setIsPlaying(true);

    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % steps.length;
        return nextStep;
      });
    }, 5000);
  };

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  const handleStepClick = (stepId: number) => {
    stopAutoPlay();
    setCurrentStep(stepId);
    setIsPlaying(true);
  };

  const handleNextStep = () => {
    stopAutoPlay();
    setCurrentStep((prev) => (prev + 1) % steps.length);
    setIsPlaying(true);
  };

  const handlePrevStep = () => {
    stopAutoPlay();
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    // Start autoplay when component mounts
    startAutoPlay();

    // Clean up interval on unmount
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <StarryBackground starCount={150} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
            How SOLspace Works
          </h1>
          <div className="mx-auto w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-6"></div>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Transforming viral social media moments into valuable digital assets on the blockchain
          </p>
        </div>

        {/* Main visualization area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left side - Step navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 h-full">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Search className="mr-2 h-5 w-5 text-cyan-400" />
                System Flow
              </h3>

              <div className="space-y-2">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-300 ${
                      currentStep === step.id
                        ? "bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-lg"
                        : "hover:bg-gray-800/50"
                    }`}
                  >
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center mr-3
                      ${
                        currentStep === step.id
                          ? `bg-gradient-to-r ${step.color} shadow-lg shadow-cyan-500/20`
                          : "bg-gray-800"
                      }
                    `}
                    >
                      {step.icon}
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${currentStep === step.id ? "text-white" : "text-gray-400"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">Step {step.id + 1}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
                  className="text-gray-400 border-gray-700"
                >
                  {isAutoPlaying ? (
                    <>
                      <span className="mr-2">Pause</span>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Auto Play
                    </>
                  )}
                </Button>

                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevStep}
                    className="text-gray-400 border-gray-700"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextStep}
                    className="text-gray-400 border-gray-700"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  {currentStep === 0 && <SocialMediaMonitoring />}

                  {currentStep === 1 && <ViralDetectionAlgorithm />}

                  {currentStep === 2 && <AutomaticNFTMinting />}

                  {currentStep === 3 && <CreatorNotification />}

                  {currentStep === 4 && <NFTClaiming />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Step description */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start">
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0
                  bg-gradient-to-r ${steps[currentStep].color}
                `}
                >
                  {steps[currentStep].icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{steps[currentStep].title}</h3>
                  <p className="text-gray-300">{steps[currentStep].description}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Step 1: Social Media Monitoring
function SocialMediaMonitoring() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg mx-auto">
        {/* Twitter-like interface */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-gray-800 p-4 flex items-center">
            <Twitter className="h-6 w-6 text-blue-400 mr-3" />
            <h3 className="font-bold text-white">Twitter Feed</h3>
            <div className="ml-auto bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">Monitoring</div>
          </div>

          <div className="divide-y divide-gray-800">
            {/* Tweet 1 */}
            <div className="p-4 hover:bg-gray-900/50 transition-colors">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 text-white font-bold">
                  C
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-bold text-white">@cryptoinfluencer</p>
                    <p className="text-gray-500 text-sm ml-2">3h</p>
                    <motion.div
                      className="ml-auto bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatDelay: 1,
                      }}
                    >
                      Potential Viral
                    </motion.div>
                  </div>
                  <p className="text-gray-300 mt-1">
                    Web3 is revolutionizing how we think about content ownership! #blockchain #web3
                  </p>

                  <div className="flex mt-3 text-gray-500 text-sm">
                    <div className="flex items-center mr-4">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>450</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <Repeat className="h-4 w-4 mr-1" />
                      <span>3,000</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>15,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tweet 2 */}
            <div className="p-4 hover:bg-gray-900/50 transition-colors">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mr-3 text-white font-bold">
                  T
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-bold text-white">@techenthusiast</p>
                    <p className="text-gray-500 text-sm ml-2">5h</p>
                  </div>
                  <p className="text-gray-300 mt-1">
                    I've been testing the new AI features and they're absolutely game-changing for content creators! #ai
                    #content
                  </p>

                  <div className="flex mt-3 text-gray-500 text-sm">
                    <div className="flex items-center mr-4">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>320</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <Repeat className="h-4 w-4 mr-1" />
                      <span>1,200</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>8,200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tweet 3 */}
            <div className="p-4 hover:bg-gray-900/50 transition-colors">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mr-3 text-white font-bold">
                  S
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-bold text-white">@solspace</p>
                    <p className="text-gray-500 text-sm ml-2">8h</p>
                  </div>
                  <p className="text-gray-300 mt-1">
                    Excited to announce our new feature that automatically preserves viral content as NFTs! 🚀 #NFT
                    #web3 #solana
                  </p>

                  <div className="flex mt-3 text-gray-500 text-sm">
                    <div className="flex items-center mr-4">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>124</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <Repeat className="h-4 w-4 mr-1" />
                      <span>980</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>3,200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanning animation */}
        <motion.div
          className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0 rgba(34, 211, 238, 0)",
              "0 0 15px rgba(34, 211, 238, 0.5)",
              "0 0 0 rgba(34, 211, 238, 0)",
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
          }}
        />

        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none"
          animate={{
            top: ["-100%", "100%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}
        />
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse"></div>
          Monitoring social media platforms for viral content
        </div>
      </div>
    </div>
  );
}

// Step 2: Viral Detection Algorithm
function ViralDetectionAlgorithm() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-gray-800 p-4 flex items-center">
            <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
            <h3 className="font-bold text-white">Viral Detection Algorithm</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Post with metrics */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 text-white font-bold">
                  C
                </div>
                <div>
                  <p className="font-bold text-white">@cryptoinfluencer</p>
                  <p className="text-gray-300 mt-1">
                    Web3 is revolutionizing how we think about content ownership! #blockchain #web3
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Engagement Score</span>
                    <span className="text-white">87/100</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Growth Rate</span>
                    <span className="text-white">92/100</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Content Quality</span>
                    <span className="text-white">78/100</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-medium">Viral Score:</span> 87/100
                </div>
                <motion.div
                  className="bg-purple-500/20 text-purple-400 text-sm px-3 py-1 rounded-full font-medium"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    repeatDelay: 1,
                  }}
                >
                  Viral Status: Confirmed
                </motion.div>
              </div>
            </div>

            {/* Metrics visualization */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-2 text-cyan-400" />
                <p className="text-xs text-gray-400">Engagement</p>
                <p className="text-lg font-bold text-white">18.5K</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-purple-400" />
                <p className="text-xs text-gray-400">Growth Rate</p>
                <p className="text-lg font-bold text-white">+425%</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
                <Award className="h-5 w-5 mx-auto mb-2 text-amber-400" />
                <p className="text-xs text-gray-400">Viral Tier</p>
                <p className="text-lg font-bold text-white">Tier 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
          Analyzing engagement metrics and growth patterns
        </div>
      </div>
    </div>
  );
}

// Step 3: Automatic NFT Minting
function AutomaticNFTMinting() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-gray-800 p-4 flex items-center">
            <Zap className="h-6 w-6 text-amber-400 mr-3" />
            <h3 className="font-bold text-white">NFT Minting Process</h3>
          </div>

          <div className="p-6">
            {/* NFT Card */}
            <div className="relative mb-8">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                }}
              />

              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-lg text-white">@cryptoinfluencer</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <span className="bg-gray-800 px-1 py-0.5 rounded font-mono">8xn45...3dfg</span>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
                      Viral Tier
                    </div>
                  </div>

                  <p className="text-gray-200 my-4">
                    Web3 is revolutionizing how we think about content ownership! #blockchain #web3
                  </p>

                  <div className="flex justify-between text-sm text-gray-400">
                    <div className="flex space-x-4">
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1 text-rose-400" />
                        15,000 likes
                      </span>
                      <span className="flex items-center">
                        <Repeat className="h-3 w-3 mr-1 text-amber-400" />
                        3,000 retweets
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Oct 23, 2024</span>
                  </div>
                </div>

                <div className="bg-gray-950/50 p-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium text-white">SOLspace NFT</div>
                        <div className="text-xs text-gray-400">8xn45...3dfg</div>
                      </div>
                    </div>

                    <motion.div
                      className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                    >
                      Minting Complete
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Minting progress */}
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Content Verification</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full w-full" />
                  </div>
                </div>
                <span className="text-xs text-green-400 ml-3">100%</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Metadata Generation</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full w-full" />
                  </div>
                </div>
                <span className="text-xs text-green-400 ml-3">100%</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Blockchain Transaction</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full w-full" />
                  </div>
                </div>
                <span className="text-xs text-green-400 ml-3">100%</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">NFT Registration</p>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full w-full" />
                  </div>
                </div>
                <span className="text-xs text-green-400 ml-3">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
          NFT successfully minted on SONIC blockchain
        </div>
      </div>
    </div>
  );
}

// Step 4: Creator Notification
function CreatorNotification() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-gray-800 p-4 flex items-center">
            <MessageCircle className="h-6 w-6 text-green-400 mr-3" />
            <h3 className="font-bold text-white">Creator Notification</h3>
          </div>

          <div className="p-6">
            {/* Email notification */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-800 p-3 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mr-2 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">SOLspace</p>
                  <p className="text-xs text-gray-400">noreply@solspace.io</p>
                </div>
                <div className="ml-auto text-xs text-gray-400">Just now</div>
              </div>

              <div className="p-4">
                <h4 className="text-lg font-medium text-white mb-3">Congratulations! Your viral post is now an NFT</h4>

                <p className="text-gray-300 text-sm mb-4">Hi @cryptoinfluencer,</p>

                <p className="text-gray-300 text-sm mb-4">
                  Your recent post about Web3 has gone viral and has been automatically preserved as an NFT on the
                  SONIC blockchain by SOLspace.
                </p>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-gray-300 text-sm italic">
                    "Web3 is revolutionizing how we think about content ownership! #blockchain #web3"
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    Posted on Oct 23, 2024 • 15,000 likes • 3,000 retweets
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4">
                  Your NFT is ready to be claimed. Click the button below to connect your wallet and claim your NFT.
                </p>

                <div className="text-center">
                  <motion.button
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 px-6 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Claim Your NFT
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Twitter notification */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-800 p-3 flex items-center">
                <Twitter className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-white font-medium">Twitter Notification</p>
                <div className="ml-auto text-xs text-gray-400">Just now</div>
              </div>

              <div className="p-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mr-3 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-bold text-white">SOLspace</p>
                      <p className="text-gray-500 text-sm ml-2">@solspace</p>
                    </div>
                    <p className="text-gray-300 mt-1">
                      🎉 Congrats @cryptoinfluencer! Your viral post has been preserved as an NFT on SONIC. Claim it
                      now at solspace.io/claim
                    </p>

                    <div className="mt-3 text-gray-500 text-sm">
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Creator notified via email and social media
        </div>
      </div>
    </div>
  );
}

// Step 5: NFT Claiming
function NFTClaiming() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-gray-800 p-4 flex items-center">
            <Wallet className="h-6 w-6 text-cyan-400 mr-3" />
            <h3 className="font-bold text-white">NFT Claiming Process</h3>
          </div>

          <div className="p-6">
            {/* Claim steps */}
            <div className="relative mb-6">
              <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent"></div>

              {/* Step 1: Connect Wallet */}
              <div className="pl-12 relative pb-6">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-green-500/20 border-green-500">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-lg text-white">Connect Wallet</h3>
                  <p className="text-sm text-gray-400">Connect your wallet to claim your NFT</p>
                </div>
              </div>

              {/* Step 2: Verify Twitter */}
              <div className="pl-12 relative pb-6">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-green-500/20 border-green-500">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-lg text-white">Verify Twitter Account</h3>
                  <p className="text-sm text-gray-400">
                    Confirm you own the Twitter account that created this viral post
                  </p>
                </div>
              </div>

              {/* Step 3: Claim NFT */}
              <div className="pl-12 relative">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-cyan-500/20 border-cyan-500">
                  <Zap className="w-5 h-5 text-cyan-500" />
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-lg text-white">Claim Your NFT</h3>
                  <p className="text-sm text-gray-400">Transfer the NFT to your connected wallet</p>
                </div>

                <motion.button
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Claim NFT
                </motion.button>
              </div>
            </div>

            {/* NFT Preview */}
            <div className="rounded-lg overflow-hidden border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-lg text-white">@cryptoinfluencer</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="bg-gray-800 px-1 py-0.5 rounded font-mono">8xn45...3dfg</span>
                    </div>
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
                    Viral Tier
                  </div>
                </div>

                <p className="text-gray-200 my-4">
                  Web3 is revolutionizing how we think about content ownership! #blockchain #web3
                </p>

                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex space-x-4">
                    <span className="flex items-center">
                      <Heart className="h-3 w-3 mr-1 text-rose-400" />
                      15,000 likes
                    </span>
                    <span className="flex items-center">
                      <Repeat className="h-3 w-3 mr-1 text-amber-400" />
                      3,000 retweets
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Oct 23, 2024</span>
                </div>
              </div>

              <div className="bg-gray-950/50 p-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-white">SOLspace NFT</div>
                      <div className="text-xs text-gray-400">8xn45...3dfg</div>
                    </div>
                  </div>

                  <div className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Unclaimed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
          <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse"></div>
          Ready for creator to claim and transfer to wallet
        </div>
      </div>
    </div>
  );
}
