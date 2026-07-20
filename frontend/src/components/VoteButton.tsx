'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { voteAction } from '@/app/actions/clubs';

type Props = { documentId: string; voteCount: number };

export default function VoteButton({ documentId, voteCount }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentCount, setCurrentCount] = useState(voteCount);
  const [voted, setVoted] = useState(false);
  const router = useRouter();

  if (voted) {
    return (
      <p style={{ color: '#0a3622', fontSize: '0.875rem', margin: 0 }}>
        ✓ Thanks for voting! ({currentCount} votes)
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        className="srh-btn"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await voteAction(documentId);
            if ('error' in result) {
              setError(result.error);
            } else {
              setCurrentCount(result.voteCount);
              setVoted(true);
              router.refresh();
            }
          })
        }
      >
        {pending ? 'Voting…' : 'Vote'}
      </button>
      {error && (
        <p style={{ color: '#842029', fontSize: '0.8rem', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
