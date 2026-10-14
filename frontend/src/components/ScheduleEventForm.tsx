'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleEventAction } from '@/app/actions/clubs';

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export default function ScheduleEventForm({ documentId }: { documentId: string }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const canSubmit = date && time && location.trim().length > 0;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 140px' }}>
          <label className="form-label" htmlFor="event-date-input">Date</label>
          <input
            id="event-date-input"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="form-group" style={{ flex: '1 1 100px' }}>
          <label className="form-label" htmlFor="event-time-input">Time</label>
          <input
            id="event-time-input"
            type="time"
            className="form-input"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '0.75rem' }}>
        <label className="form-label" htmlFor="event-location-input">Location</label>
        <input
          id="event-location-input"
          type="text"
          className="form-input"
          placeholder="e.g. SRH D 1.41, or a full address"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      {error && (
        <p style={{ color: '#842029', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{error}</p>
      )}
      {saved && (
        <p style={{ color: '#0a3622', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Saved.</p>
      )}

      <button
        type="button"
        className="srh-btn"
        style={{ marginTop: '0.75rem' }}
        disabled={pending || !canSubmit}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const club_event = `${formatDate(date)}, ${time}, Address: ${location.trim()}`;
            const result = await scheduleEventAction(documentId, club_event);
            if ('error' in result) {
              setError(result.error);
            } else {
              setSaved(true);
              router.refresh();
            }
          })
        }
      >
        {pending ? 'Saving…' : 'Save event'}
      </button>
    </div>
  );
}
