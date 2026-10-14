'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { rejectAction } from '@/app/actions/clubs';

export default function RejectButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const router = useRouter();

  if (rejected) {
    return (
      <p style={{ color: '#842029', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
        Club rejected.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="srh-btn-cancel"
        style={{ borderColor: '#c8522a', color: '#c8522a' }}
        onClick={() => setOpen(true)}
      >
        Reject
      </button>
    );
  }

  return (
    <div className="create-form-overlay" onClick={() => setOpen(false)}>
      <div className="create-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="srh-page-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
          Reject this club
        </h2>
        <div className="form-group">
          <label className="form-label" htmlFor="reject-reason">Reason *</label>
          <textarea
            id="reject-reason"
            className="form-textarea"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this proposal is being rejected…"
          />
        </div>
        {error && <div className="form-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="srh-btn"
            style={{ background: '#a3242e' }}
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await rejectAction(documentId, reason.trim());
                if ('error' in result) {
                  setError(result.error);
                } else {
                  setRejected(true);
                  router.refresh();
                }
              })
            }
          >
            {pending ? 'Rejecting…' : 'Confirm reject'}
          </button>
          <button type="button" className="srh-btn-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
