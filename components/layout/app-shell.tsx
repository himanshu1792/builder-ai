'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children: React.ReactNode;
  appId?: string;
  appName?: string;
}

export function AppShell({ children, appId, appName }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar appId={appId} appName={appName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
