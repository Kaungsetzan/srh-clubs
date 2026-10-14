'use client';
import { useActionState, useState } from 'react';
import { createProjectAction } from '@/app/actions/content';

export default function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const result = await createProjectAction(prev, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    null,
  );

  if (!open) {
    return <button className="srh-btn" onClick={() => setOpen(true)}>+ Create Project</button>;
  }

  return (
    <div className="create-form-overlay" onClick={() => setOpen(false)}>
      <div className="create-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="srh-page-title" style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>New Project</h2>
        {state?.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <form action={action} className="propose-form">
          <div className="form-group">
            <label className="form-label" htmlFor="project-title">Title *</label>
            <input id="project-title" name="title" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-status">Status</label>
            <select id="project-status" name="status" className="form-input">
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-description">Description</label>
            <textarea id="project-description" name="description" className="form-textarea" rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-cover">Cover image</label>
            <input id="project-cover" name="cover" className="form-input" type="file" accept="image/*" />
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
