"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/", exact: true },
  { label: "Applications", href: "/applications", exact: false },
  { label: "Scenarios", href: "/scenarios", exact: false },
] as const;

const comingSoonItems = [
  { label: "Manual Testing" },
  { label: "Regression Testing" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-nav-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group mr-8 flex items-center gap-2.5 outline-none"
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
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            Test
            <span className="text-primary">Forge</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "text-primary"
                    : "text-text-secondary hover:bg-nav-hover hover:text-text-primary"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-[-13px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
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
