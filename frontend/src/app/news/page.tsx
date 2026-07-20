import { getNews } from '@/lib/strapi';
import { getCurrentUser } from '@/lib/auth';
import CreateNewsForm from '@/components/CreateNewsForm';

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function NewsPage() {
  const [items, user] = await Promise.all([getNews().catch(() => null), getCurrentUser()]);
  const isAmbassador = user?.role?.name === 'Ambassador';

  if (!items) {
    return (
      <div className="empty-state">
        <h2>Could not load news</h2>
        <p>Make sure the Strapi backend is running on localhost:1337.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="srh-page-title">News</h1>
          <p className="srh-page-subtitle">{items.length} article{items.length !== 1 ? 's' : ''}</p>
        </div>
        {isAmbassador && <CreateNewsForm />}
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><h2>No news yet.</h2></div>
      ) : (
        <div className="content-list">
          {items.map((item) => (
            <div key={item.documentId} className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">{item.title}</span>
                {item.publishedDate && (
                  <span className="content-card-meta">{formatDate(item.publishedDate)}</span>
                )}
              </div>
              {item.content && (
                <p className="content-card-body">
                  {item.content.length > 200 ? item.content.slice(0, 200) + '…' : item.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
