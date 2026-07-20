import { getAmbassadors } from '@/lib/strapi';

export default async function AmbassadorsPage() {
  let ambassadors;
  try {
    ambassadors = await getAmbassadors();
  } catch {
    return (
      <div className="empty-state">
        <h2>Could not load ambassadors</h2>
        <p>Make sure the Strapi backend is running on localhost:1337.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="srh-page-title">Ambassadors</h1>
      <p className="srh-page-subtitle">
        {ambassadors.length} SRH Ambassador{ambassadors.length !== 1 ? 's' : ''} — they review and approve eligible clubs.
      </p>

      {ambassadors.length === 0 ? (
        <div className="empty-state"><h2>No ambassadors found.</h2></div>
      ) : (
        <div className="ambassadors-grid">
          {ambassadors.map((a) => (
            <div key={a.documentId ?? a.id} className="ambassador-card">
              <div className="ambassador-avatar">
                {a.username.charAt(0).toUpperCase()}
              </div>
              <span className="ambassador-name">{a.username}</span>
              <span className="badge badge-eligible" style={{ fontSize: '0.65rem' }}>Ambassador</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
