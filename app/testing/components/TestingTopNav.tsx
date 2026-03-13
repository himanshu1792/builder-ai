"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/testing", exact: true },
  { label: "Applications", href: "/testing/applications", exact: false },
  { label: "Smoke Testing", href: "/testing/smoke-testing", exact: false },
  { label: "Regression Testing", href: "/testing/regression-testing", exact: false },
  { label: "Run History", href: "/testing/run-history", exact: false },
] as const;

export function TestingTopNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-1 px-4 sm:px-6 lg:px-10">
        {/* Back to AgentForge */}
        <Link
          href="/"
          className="group mr-4 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path
              d="M10 4L6 8L10 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        {/* Divider */}
        <div className="mr-4 h-6 w-px bg-white/10" />

        {/* Logo */}
        <Link
          href="/testing"
          className="group mr-12 flex items-center gap-2.5 outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25 transition-shadow duration-200 group-hover:shadow-md group-hover:shadow-primary/30">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M3 3L8 1L13 3V7C13 10.5 10.5 13.5 8 15C5.5 13.5 3 10.5 3 7V3Z"
                fill="currentColor"
                fillOpacity="0.3"
              />
              <path
                d="M3 3L8 1L13 3V7C13 10.5 10.5 13.5 8 15C5.5 13.5 3 10.5 3 7V3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 8L7.5 9.5L10.5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Test
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Forge</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "text-violet-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-[-13px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-violet-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side spacer */}
        <div className="ml-auto" />
      </div>
    </nav>
  );
}
