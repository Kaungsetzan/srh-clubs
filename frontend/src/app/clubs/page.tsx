import Link from "next/link";
import { getClubs, type ClubStatus } from "@/lib/strapi";

const VOTE_THRESHOLD = 10;

function StatusBadge({ status }: { status: ClubStatus }) {
  const labels: Record<ClubStatus, string> = {
    pending: "Pending",
    eligible: "Eligible",
    approved: "Approved",
    rejected: "Rejected",
  };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}

export default async function ClubsPage() {
  let clubs;
  try {
    clubs = await getClubs();
  } catch {
    return (
      <div className="empty-state">
        <h2>Could not load clubs</h2>
        <p>Make sure the Strapi backend is running on localhost:1337.</p>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div>
        <h1 className="srh-page-title">Clubs</h1>
        <p className="srh-page-subtitle">No clubs have been proposed yet.</p>
        <Link href="/clubs/new" className="srh-btn">
          Propose the first club
        </Link>
      </div>
    );
  }

  const approvedClubs = clubs.filter((c) => c.club_status === "approved");
  const pendingClubs = clubs
    .filter((c) => c.club_status !== "approved")
    .sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "0.8rem",
        }}>
        <div>
          <h1 className="srh-page-title">Clubs</h1>
          <p className="srh-page-subtitle">
            {clubs.length} club{clubs.length !== 1 ? "s" : ""} proposed by
            students
          </p>
        </div>
        <Link href="/clubs/new" className="srh-btn">
          Propose a Club
        </Link>
      </div>

      {approvedClubs.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 className="srh-section-title">Official clubs</h2>
          <ClubGrid clubs={approvedClubs} />
        </div>
      )}

      {pendingClubs.length > 0 && (
        <div>
          <h2 className="srh-section-title">Pending</h2>
          <ClubGrid clubs={pendingClubs} />
        </div>
      )}
    </div>
  );
}

function ClubGrid({ clubs }: { clubs: Awaited<ReturnType<typeof getClubs>> }) {
  return (
    <div className="clubs-grid">
      {clubs.map((club) => {
        const voteCount = club.votes?.length ?? 0;
        const pct = Math.min((voteCount / VOTE_THRESHOLD) * 100, 100);
        return (
          <div key={club.documentId} className="club-card">
            <div className="club-card-header">
              <span className="club-card-title">{club.name}</span>
              <StatusBadge status={club.club_status} />
            </div>
            <p className="club-card-desc">
              {club.description?.length > 140
                ? club.description.slice(0, 140) + "…"
                : club.description}
            </p>
            {club.club_status !== 'approved' && (
              <div className="vote-progress">
                <div className="vote-progress-bar">
                  <div
                    className="vote-progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="vote-progress-label">
                  {voteCount} / {VOTE_THRESHOLD} votes
                </div>
              </div>
            )}
            <div className="club-card-footer">
              <span>Proposed by {club.founder?.username ?? "unknown"}</span>
              <Link
                href={`/clubs/${club.documentId}`}
                className="club-card-link">
                View details →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
