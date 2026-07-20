'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveAction } from '@/app/actions/clubs';

export default function ApproveButton({
  documentId,
  eligible,
}: {
  documentId: string;
  eligible: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const router = useRouter();

  if (approved) {
    return (
      <p style={{ color: '#0a3622', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
        ✓ Club approved successfully!
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        className="srh-btn srh-btn-approve"
        disabled={pending || !eligible}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await approveAction(documentId);
            if ('error' in result) {
              setError(result.error);
            } else {
              setApproved(true);
              router.refresh();
            }
          })
        }
      >
        {pending ? 'Approving…' : 'Approve'}
      </button>
      {error && (
        <p style={{ color: '#842029', fontSize: '0.8rem', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
