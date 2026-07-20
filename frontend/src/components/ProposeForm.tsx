'use client';

import { useActionState } from 'react';
import { proposeAction, type ProposeState } from '@/app/actions/clubs';

export default function ProposeForm() {
  const [state, action, pending] = useActionState<ProposeState, FormData>(
    proposeAction,
    null,
  );

  return (
    <form action={action} className="propose-form">
      {state?.error && (
        <div className="form-error">{state.error}</div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="club-name">Club name</label>
        <input
          id="club-name"
          name="name"
          className="form-input"
          type="text"
          placeholder="e.g. Chess Club, Photography Society…"
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="club-desc">Description</label>
        <textarea
          id="club-desc"
          name="description"
          className="form-textarea"
          placeholder="What is this club about? What will members do?"
          required
          maxLength={1000}
        />
        <span className="form-hint">
          A clear description helps other students decide whether to vote for your club.
        </span>
      </div>

      <div>
        <button type="submit" className="srh-btn" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit proposal'}
        </button>
      </div>
    </form>
  );
}
