"use client";

import Link from "next/link";
import { useState } from "react";

const tiles = [
  {
    id: "testing",
    title: "Testing AI Agent",
    description:
      "AI-powered test generation platform. Describe what to test in plain English and get working Playwright scripts with a ready-to-merge PR.",
    href: "/testing",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    hoverGradient: "group-hover:from-violet-500 group-hover:via-purple-500 group-hover:to-indigo-600",
    iconBg: "bg-white/20",
    status: "active" as const,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L16 2L26 6V14C26 21 21 27 16 30C11 27 6 21 6 14V6Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 16L15 19L21 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    features: ["Smoke Testing", "Regression Testing", "Auto PR Creation", "Multi-Agent Pipeline"],
  },
  {
    id: "devops",
    title: "DevOps AI Agent",
    description:
      "Intelligent DevOps automation. Manage CI/CD pipelines, infrastructure monitoring, and deployment workflows with AI-driven insights.",
    href: "#",
    gradient: "from-cyan-600 via-teal-600 to-emerald-700",
    hoverGradient: "group-hover:from-cyan-500 group-hover:via-teal-500 group-hover:to-emerald-600",
    iconBg: "bg-white/20",
    status: "coming-soon" as const,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2"/>
        <path d="M16 4C16 4 20 10 20 16C20 22 16 28 16 28" stroke="white" strokeWidth="2"/>
        <path d="M16 4C16 4 12 10 12 16C12 22 16 28 16 28" stroke="white" strokeWidth="2"/>
        <path d="M4 16H28" stroke="white" strokeWidth="2"/>
        <path d="M6 10H26" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
        <path d="M6 22H26" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
      </svg>
    ),
    features: ["CI/CD Pipelines", "Infra Monitoring", "Auto Deployments", "Incident Response"],
  },
  {
    id: "create",
    title: "Create Your Own Agents",
    description:
      "Build, orchestrate, and deploy custom AI agents. Define system prompts, chain agents into pipelines, and expose them as API endpoints.",
    href: "/create-agents",
    gradient: "from-orange-500 via-amber-500 to-yellow-600",
    hoverGradient: "group-hover:from-orange-400 group-hover:via-amber-400 group-hover:to-yellow-500",
    iconBg: "bg-white/20",
    status: "active" as const,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="10" height="10" rx="2" stroke="white" strokeWidth="2"/>
        <rect x="17" y="5" width="10" height="10" rx="2" stroke="white" strokeWidth="2"/>
        <rect x="5" y="17" width="10" height="10" rx="2" stroke="white" strokeWidth="2"/>
        <path d="M22 18V28M17 23H27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    features: ["Agent Builder", "Orchestration Chains", "API Endpoints", "Cost Tracking"],
  },
];

export default function AgentForgeLanding() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-violet-500/10 via-transparent to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Agent<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Forge</span>
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your unified AI agent platform. Build, test, deploy, and orchestrate
            intelligent agents that automate your entire software lifecycle.
          </p>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiles.map((tile) => {
            const isComingSoon = tile.status === "coming-soon";
            const isHovered = hoveredId === tile.id;

            const content = (
              <div
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
                  isComingSoon ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                } ${isHovered && !isComingSoon ? "scale-[1.02] -translate-y-1" : ""}`}
                onMouseEnter={() => setHoveredId(tile.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Card background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} ${tile.hoverGradient} transition-all duration-500`} />

                {/* Shine effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`} />

                {/* Content */}
                <div className="relative p-8 sm:p-10 min-h-[380px] flex flex-col">
                  {/* Status badge */}
                  {isComingSoon && (
                    <div className="absolute top-5 right-5">
                      <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tile.iconBg} backdrop-blur-sm mb-6 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
                    {tile.icon}
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">{tile.title}</h2>
                  <p className="text-white/70 text-sm leading-relaxed mb-6 flex-grow">
                    {tile.description}
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tile.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${isHovered && !isComingSoon ? "translate-x-1" : ""}`}>
                    {isComingSoon ? (
                      <span className="text-white/50">Under Development</span>
                    ) : (
                      <>
                        <span>Launch Agent</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}>
                          <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );

            if (isComingSoon) {
              return <div key={tile.id}>{content}</div>;
            }

            return (
              <Link key={tile.id} href={tile.href} className="outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-2xl">
                {content}
              </Link>
            );
          })}
        </div>

        {/* Footer tagline */}
        <div className="text-center mt-16 sm:mt-20">
          <p className="text-sm text-gray-500">
            Powered by multi-agent AI pipelines &middot; Built for enterprise teams
          </p>
        </div>
      </div>
    </div>
  );
}
