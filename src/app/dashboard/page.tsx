import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard — LoreAI',
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const secret = process.env.DASHBOARD_SECRET;

  // Auth gate: require ?key= matching DASHBOARD_SECRET
  if (!secret || params.key !== secret) {
    redirect('/');
  }

  return <DashboardClient />;
}
