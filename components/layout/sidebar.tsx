'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  Play,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  appId?: string;
  appName?: string;
}

const iconColors: Record<string, { bg: string; text: string }> = {
  Dashboard: { bg: 'bg-blue-50', text: 'text-blue-500' },
  Agents: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  Orchestrations: { bg: 'bg-amber-50', text: 'text-amber-500' },
  Playground: { bg: 'bg-violet-50', text: 'text-violet-500' },
  Billing: { bg: 'bg-rose-50', text: 'text-rose-400' },
  Applications: { bg: 'bg-indigo-50', text: 'text-indigo-500' },
  'Model Pricing': { bg: 'bg-slate-100', text: 'text-slate-500' },
};

export function Sidebar({ appId, appName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const globalLinks = [
    { href: '/create-agents', label: 'Applications', icon: LayoutDashboard },
    { href: '/create-agents/settings/model-pricing', label: 'Model Pricing', icon: Settings },
  ];

  const appLinks = appId
    ? [
        { href: `/create-agents/applications/${appId}`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `/create-agents/applications/${appId}/agents`, label: 'Agents', icon: Bot },
        { href: `/create-agents/applications/${appId}/orchestrations`, label: 'Orchestrations', icon: GitBranch },
        { href: `/create-agents/applications/${appId}/playground`, label: 'Playground', icon: Play },
        { href: `/create-agents/applications/${appId}/billing`, label: 'Billing', icon: Receipt },
      ]
    : [];

  const isActive = (href: string) => {
    if (href === '/create-agents') return pathname === '/create-agents';
    if (appId && href === `/create-agents/applications/${appId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderLink = (link: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const active = isActive(link.href);
    const colors = iconColors[link.label] ?? { bg: 'bg-gray-50', text: 'text-gray-500' };
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
        title={collapsed ? link.label : undefined}
      >
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors',
            active ? 'bg-primary text-primary-foreground' : cn(colors.bg, colors.text)
          )}
        >
          <link.icon className="h-4 w-4" />
        </div>
        {!collapsed && <span>{link.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Back to AgentForge */}
      <div className="border-b px-3 py-2">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Back to AgentForge' : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Back to AgentForge</span>}
        </Link>
      </div>

      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <Link href="/create-agents" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Agent Builder</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'mx-auto' : 'ml-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {/* Global */}
        {globalLinks.map(renderLink)}

        {/* App-scoped */}
        {appLinks.length > 0 && (
          <>
            <div className="my-3 border-t" />
            {!collapsed && appName && (
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-foreground">
                {appName}
              </p>
            )}
            {appLinks.map(renderLink)}
          </>
        )}
      </nav>
    </aside>
  );
}
