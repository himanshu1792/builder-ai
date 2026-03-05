export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            TestForge
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered test generation platform
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Welcome to TestForge
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Describe what to test in plain English and get a ready-to-merge PR
            with working Playwright scripts.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Phase 1 foundation complete. Application management coming in Phase
            2.
          </p>
        </div>
      </main>
    </div>
  );
}
