// src/pages/pioneer-partnership.tsx
import React from "react";
import ApplicationForm from "../components/forms/ApplicationForm";
const PioneerPartnership = () => {
  const benefits = [
    {
      title: "Enhanced Liquidity Incentives",
      features: [
        {
          subtitle: "Immediate Benefits",
          items: [
            "1.5x LP rewards multiplier for first 90 days",
            "Zero fees on initial liquidity pool creation",
            "Protected liquidity pools with minimum IL protection",
          ],
        },
        {
          subtitle: "Long-term Advantages",
          items: [
            "Permanent reduced fees for LP providers",
            "Priority access to new liquidity mining programs",
            "Custom incentive structures for your community",
            "Advanced pool management tools",
          ],
        },
      ],
    },
    {
      title: "Token Utility Enhancement",
      features: [
        {
          subtitle: "Gas Token Integration",
          items: [
            "Featured status as primary gas token",
            "Optimized conversion paths for minimal slippage",
            "Dedicated liquidity reserves for stable gas payments",
            "Priority routing in the SOLess ecosystem",
          ],
        },
        {
          subtitle: "Burn Mechanics",
          items: [
            "Strategic burn rate customization",
            "Real-time burn analytics",
            "Automated buy-back and burn mechanisms",
            "Community-voted burn targets",
          ],
        },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-soless-blue to-soless-purple bg-clip-text text-transparent">
            SOLess Pioneer Partnership Program
          </span>
        </h1>
        <p className="text-xl text-gray-300 italic mb-8">
          Transform your meme token into a utility powerhouse
        </p>
      </div>

      {/* Executive Summary */}
      <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-12">
        <h2 className="text-2xl font-bold text-soless-blue mb-4">
          Executive Summary
        </h2>
        <p className="text-gray-300">
          SOLess is revolutionizing the SONIC DeFi landscape by enabling any
          token to be used for gas fees. We're seeking pioneering meme token
          partners to help shape the future of gasless trading while gaining
          exclusive benefits and enhanced utility for their communities.
        </p>
      </div>

      {/* Key Benefits */}
      <div className="grid gap-8 mb-12">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-black/30 border border-soless-blue/40 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-soless-blue mb-6">
              {benefit.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefit.features.map((feature, fIndex) => (
                <div key={fIndex}>
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">
                    {feature.subtitle}
                  </h3>
                  <ul className="space-y-2">
                    {feature.items.map((item, iIndex) => (
                      <li
                        key={iIndex}
                        className="flex items-start text-gray-300"
                      >
                        <span className="text-soless-blue mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Application Form */}
      <ApplicationForm />
    </div>
  );
};

export default PioneerPartnership;
