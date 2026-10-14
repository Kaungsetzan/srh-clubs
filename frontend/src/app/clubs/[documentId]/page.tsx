import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClub, getStrapiMediaUrl, type ClubStatus } from '@/lib/strapi';
import { getCurrentUser, getToken } from '@/lib/auth';
import VoteButton from '@/components/VoteButton';
import ApproveButton from '@/components/ApproveButton';
import RejectButton from '@/components/RejectButton';
import ScheduleEventForm from '@/components/ScheduleEventForm';
import MembersList from '@/components/MembersList';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
const VOTE_THRESHOLD = 10;

const STATUS_LABELS: Record<ClubStatus, string> = {
  pending: 'Pending',
  eligible: 'Eligible — awaiting ambassador approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function StatusBadge({ status }: { status: ClubStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  const token = await getToken();

  const [currentUser, club] = await Promise.all([
    getCurrentUser(),
    getClub(documentId).catch(() => null),
  ]);
  if (!club) notFound();

  const isLoggedIn = currentUser !== null;
  const isAmbassador = currentUser?.role?.name === 'Ambassador';
  const isFounder = isLoggedIn && currentUser.documentId === club.founder?.documentId;
  const clubStatus = club.club_status;
  const isApproved = clubStatus === 'approved';
  const coverUrl = getStrapiMediaUrl(club.cover);
  const isCoverImage = club.cover?.mime?.startsWith('image/') ?? false;
  const founderProfileUrl = getStrapiMediaUrl(club.founder?.profile);
  const isFounderProfileImage = club.founder?.profile?.mime?.startsWith('image/') ?? false;
  const members = club.votes
    ?.map((v) => v.voter)
    .filter((v): v is NonNullable<typeof v> => v != null) ?? [];

  // Check if the current user has already voted via a dedicated Strapi endpoint
  let hasVoted = false;
  if (isLoggedIn && token) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/clubs/${documentId}/my-vote`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        hasVoted = data.hasVoted === true;
      }
    } catch {
      // hasVoted stays false — user will see vote button; duplicate blocked by Strapi
    }
  }

  const canVote =
    isLoggedIn && !hasVoted && clubStatus !== 'approved' && clubStatus !== 'rejected';

  const voteCount = club.votes?.length ?? 0;
  const pct = Math.min((voteCount / VOTE_THRESHOLD) * 100, 100);

  return (
    <div className="club-detail">
      <Link href="/clubs" className="back-link">
        ← Back to all clubs
      </Link>

      <div className="club-detail-layout">
        <div>
          <h1 className="club-detail-title">{club.name}</h1>

          <div className="club-detail-meta">
            <StatusBadge status={clubStatus} />
            <span>·</span>
            <span>Proposed by {club.founder?.username ?? 'unknown'}</span>
            {club.approvedBy && (
              <>
                <span>·</span>
                <span>Approved by {club.approvedBy.username}</span>
              </>
            )}
          </div>

          <p className="club-detail-desc">{club.description}</p>

          {coverUrl && isCoverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={`${club.name} cover`} className="club-detail-cover" />
          ) : (
            <div className="club-detail-cover club-detail-cover-placeholder">
              No cover image
            </div>
          )}

          <div className="detail-section">
            <h2 className="srh-section-title">Founder</h2>
            <div className="club-detail-founder-block">
              {founderProfileUrl && isFounderProfileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={founderProfileUrl}
                  alt={`${club.founder?.username ?? 'Founder'} profile`}
                  className="club-detail-founder-avatar"
                />
              ) : (
                <div className="club-detail-founder-avatar club-detail-founder-avatar-fallback">
                  {(club.founder?.username ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="club-detail-founder-name">{club.founder?.username ?? 'unknown'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2 className="srh-section-title">Club Info</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div className="detail-label">Contact email</div>
                <div className="detail-value">{club.email ?? '—'}</div>
              </div>
              <div>
                <div className="detail-label">Maximum members</div>
                <div className="detail-value">{club.maxMembers ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2 className="srh-section-title">Events</h2>
            <div className="club-detail-events-card">
              {club.club_event ? (
                <p className="club-detail-events-text">{club.club_event}</p>
              ) : (
                <p style={{ color: 'var(--srh-muted)', fontSize: '0.875rem' }}>No events scheduled.</p>
              )}
              {isFounder && clubStatus === 'approved' && (
                <ScheduleEventForm documentId={club.documentId} />
              )}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hasVoted && clubStatus !== 'approved' && clubStatus !== 'rejected' && (
              <p style={{ color: 'var(--srh-muted)', fontSize: '0.875rem', margin: 0 }}>
                You have already voted for this club.
              </p>
            )}
            {isAmbassador && clubStatus === 'pending' && (
              <p style={{ color: 'var(--srh-muted)', fontSize: '0.875rem', margin: 0 }}>
                Needs {VOTE_THRESHOLD} votes before it can be approved.
              </p>
            )}
            {(clubStatus === 'approved' || clubStatus === 'rejected') && (
              <p style={{ color: 'var(--srh-muted)', fontSize: '0.875rem', margin: 0 }}>
                {clubStatus === 'approved'
                  ? 'This club has been approved — voting is closed.'
                  : `This proposal was rejected.${club.rejectionReason ? ` Reason: ${club.rejectionReason}` : ''}`}
              </p>
            )}
          </div>
        </div>

        <aside className="club-detail-sidebar">
          {!isApproved ? (
            <div>
              <div className="detail-label">Votes</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="vote-count">{voteCount}</span>
                <span className="vote-label">/ {VOTE_THRESHOLD} needed for eligibility</span>
              </div>
              <div className="vote-progress" style={{ marginTop: '0.6rem' }}>
                <div className="vote-progress-bar">
                  <div className="vote-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginTop: '1rem' }}>
                {canVote && (
                  <VoteButton documentId={club.documentId} voteCount={voteCount} />
                )}
                {!isLoggedIn && clubStatus !== 'rejected' && (
                  <Link href="/login" className="srh-btn" style={{ textDecoration: 'none' }}>
                    Log in to vote
                  </Link>
                )}
                {isAmbassador && clubStatus !== 'rejected' && (
                  <ApproveButton documentId={club.documentId} eligible={clubStatus === 'eligible'} />
                )}
                {isAmbassador && clubStatus !== 'rejected' && (
                  <RejectButton documentId={club.documentId} />
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="detail-label">Members</div>
              <MembersList members={members} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
