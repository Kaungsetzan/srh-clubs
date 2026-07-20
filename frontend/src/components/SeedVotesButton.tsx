'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { seedVotesAction } from '@/app/actions/clubs';

export default function SeedVotesButton({ documentId }: { documentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <button
        type="button"
        className="srh-btn-cancel"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await seedVotesAction(documentId);
            if ('error' in res) {
              setError(res.error);
            } else {
              setResult(res.voteCount);
              router.refresh();
            }
          })
        }
      >
        {pending ? 'Seeding…' : 'Dev: seed votes'}
      </button>
      {error && (
        <p style={{ color: '#842029', fontSize: '0.8rem', margin: 0 }}>{error}</p>
      )}
      {result !== null && (
        <p style={{ color: 'var(--srh-muted)', fontSize: '0.8rem', margin: 0 }}>
          Now at {result} votes.
        </p>
      )}
    </div>
  );
}
