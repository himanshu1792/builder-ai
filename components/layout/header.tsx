'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: 'Agent Builder', href: '/create-agents' }];

  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    const seg = segments[i];

    // Skip 'create-agents' prefix segment
    if (seg === 'create-agents') continue;

    // Skip raw IDs — they get labeled by context
    if (seg === 'applications') {
      crumbs.push({ label: 'Applications', href: '/create-agents' });
    } else if (seg === 'agents') {
      crumbs.push({ label: 'Agents', href: path });
    } else if (seg === 'orchestrations') {
      crumbs.push({ label: 'Orchestrations', href: path });
    } else if (seg === 'new') {
      crumbs.push({ label: 'New' });
    } else if (seg === 'playground') {
      crumbs.push({ label: 'Playground' });
    } else if (seg === 'billing') {
      crumbs.push({ label: 'Billing' });
    } else if (seg === 'logs') {
      crumbs.push({ label: 'Logs' });
    } else if (seg === 'settings') {
      crumbs.push({ label: 'Settings', href: path });
    } else if (seg === 'model-pricing') {
      crumbs.push({ label: 'Model Pricing' });
    } else if (segments[i - 1] === 'applications') {
      // App ID — label as "App"
      crumbs.push({ label: 'Dashboard', href: path });
    }
    // Other IDs (agentId, orchId) are skipped — detail pages show their own title
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Link>
    </header>
  );
}
