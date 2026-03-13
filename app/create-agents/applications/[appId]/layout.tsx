'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useApplication } from '@/hooks/use-applications';
import { useParams } from 'next/navigation';

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appId } = useParams<{ appId: string }>();
  const { application } = useApplication(appId);

  return (
    <AppShell appId={appId} appName={application?.name}>
      {children}
    </AppShell>
  );
}
