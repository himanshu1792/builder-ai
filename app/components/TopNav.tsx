"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/", exact: true },
  { label: "Applications", href: "/applications", exact: false },
  { label: "Smoke Testing", href: "/smoke-testing", exact: false },
  { label: "Regression Testing", href: "/regression-testing", exact: false },
  { label: "Run History", href: "/run-history", exact: false },
] as const;

const comingSoonItems: ReadonlyArray<{ label: string }> = [];

export function TopNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-nav-bg/95 backdrop-blur-2xl">
      <style>{`
        @keyframes nav-slide {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .nav-container {
          animation: nav-slide 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .nav-link-active::after {
          animation: slide-up 0.4s ease-out 0.1s both;
        }
      `}</style>
      <div className="nav-container flex h-14 items-center gap-1 px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="group mr-12 flex items-center gap-2.5 outline-none transition-all duration-200 hover:scale-105"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/50">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-surface"
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
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Test
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Forge
            </span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {navItems.map((item, idx) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
                style={{
                  animationDelay: `${0.1 + idx * 0.05}s`,
                }}
              >
                {item.label}
                {active && (
                  <span className="nav-link-active absolute bottom-[-13px] left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent" />
                )}
              </Link>
            );
          })}

          {/* Coming Soon Items */}
          {comingSoonItems.map((item) => (
            <span
              key={item.label}
              className="group relative cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-text-muted"
            >
              <span className="flex items-center gap-1.5">
                {item.label}
                <span className="inline-flex items-center rounded-full bg-badge-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-badge-text">
                  Soon
                </span>
              </span>
            </span>
          ))}
        </div>

        {/* Right side spacer for future elements (profile, settings, etc.) */}
        <div className="ml-auto" />
      </div>
    </nav>
  );
}
