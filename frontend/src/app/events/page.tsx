import { getEvents, getStrapiMediaUrl } from '@/lib/strapi';
import { getCurrentUser } from '@/lib/auth';
import CreateEventForm from '@/components/CreateEventForm';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function EventsPage() {
  const [items, user] = await Promise.all([getEvents().catch(() => null), getCurrentUser()]);
  const isAmbassador = user?.role?.name === 'Ambassador';

  if (!items) {
    return (
      <div className="empty-state">
        <h2>Could not load events</h2>
        <p>Make sure the Strapi backend is running on localhost:1337.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="srh-page-title">Events</h1>
          <p className="srh-page-subtitle">{items.length} event{items.length !== 1 ? 's' : ''}</p>
        </div>
        {isAmbassador && <CreateEventForm />}
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><h2>No events yet.</h2></div>
      ) : (
        <div className="content-list">
          {items.map((item) => {
            const coverUrl = getStrapiMediaUrl(item.cover);
            const isCoverImage = item.cover?.mime?.startsWith('image/') ?? false;
            return (
            <div key={item.documentId} className="content-card">
              {coverUrl && isCoverImage ? (
                <img src={coverUrl} alt="" className="card-cover" />
              ) : (
                <div className="card-cover card-cover-placeholder">No image</div>
              )}
              <div className="content-card-header">
                <span className="content-card-title">{item.title}</span>
              </div>
              <div className="content-card-meta-row">
                <span>📅 {formatDate(item.date)}</span>
                {item.location && <span>📍 {item.location}</span>}
              </div>
              {item.description && (
                <p className="content-card-body">
                  {item.description.length > 200 ? item.description.slice(0, 200) + '…' : item.description}
                </p>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
