import { TestingTopNav } from "./components/TestingTopNav";

export default function TestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Subtle grid background matching landing page */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <TestingTopNav />
      <main className="relative z-10 w-full px-4 py-6 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
