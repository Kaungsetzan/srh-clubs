'use client';
import { useActionState, useState } from 'react';
import { createEventAction } from '@/app/actions/content';

export default function CreateEventForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const result = await createEventAction(prev, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    null,
  );

  if (!open) {
    return <button className="srh-btn" onClick={() => setOpen(true)}>+ Create Event</button>;
  }

  return (
    <div className="create-form-overlay" onClick={() => setOpen(false)}>
      <div className="create-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="srh-page-title" style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>New Event</h2>
        {state?.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <form action={action} className="propose-form">
          <div className="form-group">
            <label className="form-label" htmlFor="event-title">Title *</label>
            <input id="event-title" name="title" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="event-date">Date & Time *</label>
            <input id="event-date" name="date" type="datetime-local" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="event-location">Location</label>
            <input id="event-location" name="location" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="event-description">Description</label>
            <textarea id="event-description" name="description" className="form-textarea" rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="event-cover">Cover image</label>
            <input id="event-cover" name="cover" className="form-input" type="file" accept="image/*" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="srh-btn" disabled={pending}>
              {pending ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className="srh-btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
