import { TestingTopNav } from "./components/TestingTopNav";

export default function TestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TestingTopNav />
      <main className="w-full px-4 py-6 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
