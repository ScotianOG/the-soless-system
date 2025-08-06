import React, { useState } from "react";
import { useForm } from "@formspree/react";

const MarketingApplicationForm = () => {
  const [formState, setFormState] = useState({
    telegramName: "",
    servicesOffered: "",
    experience: "",
    previousProjects: "",
    answers: Array(20).fill(""),
  });

  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [state, handleSubmit] = useForm("mgvvwppj");

  const correctAnswers = [
    "c",
    "b",
    "c",
    "b",
    "c",
    "b",
    "c",
    "c",
    "c",
    "c",
    "b",
    "c",
    "a",
    "d",
    "d",
    "b",
    "d",
    "c",
    "b",
    "c",
  ];

  interface FormState {
    telegramName: string;
    servicesOffered: string;
    experience: string;
    previousProjects: string;
    answers: string[];
  }

  interface SubmissionData {
    telegramName: string;
    servicesOffered: string;
    experience: string;
    previousProjects: string;
    score: number;
    passed: boolean;
    answers: {
      question: number;
      answer: string;
      correct: boolean;
    }[];
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Calculate score
    const totalScore = formState.answers.reduce(
      (acc: number, answer: string, index: number) => {
        return acc + (answer.toLowerCase() === correctAnswers[index] ? 1 : 0);
      },
      0
    );

    setScore(totalScore);
    setShowScore(true);

    // Prepare submission data - includes both score and individual answers
    const submissionData: SubmissionData = {
      telegramName: formState.telegramName,
      servicesOffered: formState.servicesOffered,
      experience: formState.experience,
      previousProjects: formState.previousProjects,
      score: totalScore,
      passed: totalScore >= 16,
      answers: formState.answers.map((answer: string, index: number) => ({
        question: index + 1,
        answer: answer,
        correct: answer.toLowerCase() === correctAnswers[index],
      })),
    };

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    questionIndex: number | null = null
  ) => {
    const { name, value } = e.target;

    if (questionIndex !== null) {
      setFormState((prev) => ({
        ...prev,
        answers: [
          ...prev.answers.slice(0, questionIndex),
          value,
          ...prev.answers.slice(questionIndex + 1),
        ],
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (state.succeeded && score >= 16) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-black/30 rounded-xl border border-soless-blue/40">
        <p className="text-xl text-green-500 text-center">
          Thank you for your application! We'll review and contact you soon.
        </p>
      </div>
    );
  }

  const questions = [
    {
      question: "What is the primary innovation of the SOLess DEX?",
      options: [
        "Fastest trading on Solana",
        "Lowest fees in DeFi",
        "Ability to pay gas fees with any listed token",
        "Highest liquidity pools",
      ],
    },
    {
      question: "In SOLspace, what happens when a user makes a post?",
      options: [
        "It gets liked automatically",
        "It's automatically minted as an NFT",
        "It's shared to other platforms",
        "It gets monetized immediately",
      ],
    },
    {
      question: "How does SOLarium provide liquidity for NFTs?",
      options: [
        "Through peer-to-peer trading",
        "By connecting to other marketplaces",
        "Through a guaranteed floor price backed by SOLess tokens",
        "By fractionalizing NFTs",
      ],
    },
    {
      question:
        "What are SOLess tokens ($SOUL) used for in the ecosystem? (Select the incorrect answer)",
      options: [
        "Paying for gas fees",
        "Mining new blocks on Solana",
        "Supporting NFT floor prices",
        "Platform governance",
      ],
    },
    {
      question: "How does content verification work in SOLspace?",
      options: [
        "Manual moderator approval",
        "AI verification",
        "Blockchain-based immutable records with source tracking",
        "Community voting",
      ],
    },
    {
      question:
        "What is the relationship between the three platforms (SOLess, SOLspace, SOLarium)?",
      options: [
        "They are completely separate projects",
        "They are integrated parts of one ecosystem sharing the $SOUL token",
        "They are competing platforms",
        "They only share a name",
      ],
    },
    {
      question: "What happens when tokens are used for gas fees on SOLess?",
      options: [
        "They are returned to the user",
        "They are sent to developers",
        "A portion is burned",
        "They are locked forever",
      ],
    },
    {
      question: "How can content creators monetize their content on SOLspace?",
      options: [
        "Only through advertisements",
        "Only through direct tips",
        "Multiple ways including NFT sales, tips, and engagement rewards",
        "They cannot monetize content",
      ],
    },
    {
      question: "What is required to pay gas fees on SOLess?",
      options: [
        "Must have SOL in wallet",
        "Must have USDC only",
        "Any listed token can be used",
        "Must have $SOUL only",
      ],
    },
    {
      question: "What is the purpose of SOLarium's floor price mechanism?",
      options: [
        "To make all NFTs the same price",
        "To prevent anyone from selling NFTs",
        "To provide guaranteed minimum value backed by $SOUL tokens",
        "To increase NFT prices automatically",
      ],
    },
    {
      question: "How does SOLspace verify content creators' identities?",
      options: [
        "Through traditional KYC",
        "Through blockchain-verified signatures and stake-based verification",
        "Through social media links",
        "Through email verification",
      ],
    },
    {
      question: "What happens when users burn $SOUL tokens for ad removal?",
      options: [
        "Tokens are redistributed to stakers",
        "Tokens are locked for 1 year",
        "Tokens are permanently removed from circulation",
        "Tokens are sent to a community fund",
      ],
    },
    {
      question:
        "In SOLarium, what can NFT holders do if they need immediate liquidity?",
      options: [
        "Trade their NFT back to the vault for the floor price in $SOUL tokens",
        "Take out a loan against their NFT",
        "Only sell on the open market",
        "Convert their NFT to fractional shares",
      ],
    },
    {
      question: "What storage solution does SOLspace use for media content?",
      options: [
        "Centralized cloud storage",
        "Traditional databases",
        "Local node storage",
        "IPFS and Arweave",
      ],
    },
    {
      question: "How do Trust Scores work in SOLspace?",
      options: [
        "Based only on follower count",
        "Measured by post frequency",
        "Calculated from user reports",
        "Derived from accuracy history and community feedback",
      ],
    },
    {
      question:
        "What is the primary purpose of the SOLess ecosystem's deflationary mechanics?",
      options: [
        "To increase token price artificially",
        "To maintain long-term value sustainability",
        "To reduce transaction speeds",
        "To limit new user participation",
      ],
    },
    {
      question: "How are governance decisions made in the ecosystem?",
      options: [
        "By the development team only",
        "By random selection",
        "By the largest token holders only",
        "Through DAO voting using $SOUL tokens",
      ],
    },
    {
      question:
        "What happens to the original content when a SOLspace post is shared?",
      options: [
        "The ownership transfers to the sharer",
        "The original NFT is duplicated",
        "The original creator maintains verifiable ownership",
        "The content becomes public domain",
      ],
    },
    {
      question: "How does SOLspace handle content moderation?",
      options: [
        "Through AI moderation only",
        "Through community-driven processes with blockchain transparency",
        "Through centralized team decisions",
        "Through automated keyword filtering",
      ],
    },
    {
      question:
        "What feature enables SOLess to process high volumes of transactions?",
      options: [
        "Layer 2 scaling",
        "Limited transaction types",
        "Solana's high throughput architecture",
        "Transaction batching",
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Banner Image */}
      <img
        src="/assets/images/WordBanner.png"
        alt="SOLess Banner"
        className="w-full h-auto rounded-xl mb-8"
      />

      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
          SOLess Marketing Application Form
        </h1>
        <p className="text-gray-300 text-center mb-8">
          DMs will not be answered until form is received
        </p>

        {showScore && score < 16 ? (
          <div className="text-red-500 text-center p-6 bg-red-500/10 rounded-lg mb-8">
            Sorry, you did not pass the test. Your submission is denied. Study
            hard and try again.
            <p className="text-sm mt-2">Score: {score}/20</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="telegramName"
                  className="block text-sm text-gray-300 mb-2"
                >
                  Telegram Name
                </label>
                <input
                  type="text"
                  id="telegramName"
                  name="telegramName"
                  value={formState.telegramName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-black/50 border border-soless-blue/40 rounded-lg text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="servicesOffered"
                  className="block text-sm text-gray-300 mb-2"
                >
                  Services Offered
                </label>
                <textarea
                  id="servicesOffered"
                  name="servicesOffered"
                  value={formState.servicesOffered}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-black/50 border border-soless-blue/40 rounded-lg text-white h-24"
                />
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm text-gray-300 mb-2"
                >
                  Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formState.experience}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-black/50 border border-soless-blue/40 rounded-lg text-white h-24"
                />
              </div>

              <div>
                <label
                  htmlFor="previousProjects"
                  className="block text-sm text-gray-300 mb-2"
                >
                  Previous Projects
                </label>
                <textarea
                  id="previousProjects"
                  name="previousProjects"
                  value={formState.previousProjects}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-black/50 border border-soless-blue/40 rounded-lg text-white h-24"
                />
              </div>
            </div>

            {/* Quiz Questions */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-soless-blue">
                Knowledge Assessment
              </h2>

              {questions.map((questionData, index) => (
                <div key={index} className="space-y-2 mb-10">
                  <p className="text-gray-200">
                    {index + 1}. {questionData.question}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {questionData.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          name={`question${index + 1}`}
                          value={String.fromCharCode(97 + optIndex)}
                          onChange={(e) => handleInputChange(e, index)}
                          required
                          className="text-soless-blue focus:ring-soless-blue"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={state.submitting}
              className="w-full bg-gradient-to-r from-soless-blue to-soless-purple px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {state.submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>

      {/* Mascot Image */}
      <div className="flex justify-center mt-8">
        <img
          src="/assets/images/PresaleSoulie.png"
          alt="SOLess Mascot"
          className="h-48 w-auto"
        />
      </div>
    </div>
  );
};

export default MarketingApplicationForm;
