import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import ProposeForm from '@/components/ProposeForm';

const VOTE_THRESHOLD = 10;

export default async function NewClubPage() {
  // Secondary guard: proxy already redirects, but Server Components verify too
  // TODO: check role — only Authenticated+ can propose
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div>
      <Link href="/clubs" className="back-link">
        ← Back to all clubs
      </Link>
      <h1 className="srh-page-title">Propose a Club</h1>
      <p className="srh-page-subtitle">
        Proposing as <strong>{user.username}</strong>. Once your proposal reaches{' '}
        {VOTE_THRESHOLD} votes it becomes eligible for ambassador approval.
      </p>
      <ProposeForm />
    </div>
  );
}
