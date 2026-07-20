'use client';

import { useState } from 'react';
import type { StrapiUser } from '@/lib/strapi';

const VISIBLE_COUNT = 8;

export default function MembersList({ members }: { members: StrapiUser[] }) {
  const [expanded, setExpanded] = useState(false);

  if (members.length === 0) {
    return (
      <p style={{ color: 'var(--srh-muted)', fontSize: '0.875rem' }}>
        No members recorded yet.
      </p>
    );
  }

  const visible = expanded ? members : members.slice(0, VISIBLE_COUNT);
  const hasMore = !expanded && members.length > VISIBLE_COUNT;

  return (
    <div className="club-detail-members-list">
      {visible.map((m) => (
        <div key={m.documentId ?? m.id} className="club-detail-member-row">
          <div className="club-detail-member-avatar">{m.username.charAt(0).toUpperCase()}</div>
          <span className="club-detail-member-name">{m.username}</span>
        </div>
      ))}
      {hasMore && (
        <button
          type="button"
          className="club-detail-member-see-more"
          onClick={() => setExpanded(true)}
        >
          See more
        </button>
      )}
    </div>
  );
}
