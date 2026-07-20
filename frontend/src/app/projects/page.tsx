import { getProjects, type ProjectStatus } from '@/lib/strapi';
import { getCurrentUser } from '@/lib/auth';
import CreateProjectForm from '@/components/CreateProjectForm';

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`badge badge-project-${status}`}>
      {status === 'ongoing' ? 'Ongoing' : 'Completed'}
    </span>
  );
}

export default async function ProjectsPage() {
  const [items, user] = await Promise.all([getProjects().catch(() => null), getCurrentUser()]);
  const isAmbassador = user?.role?.name === 'Ambassador';

  if (!items) {
    return (
      <div className="empty-state">
        <h2>Could not load projects</h2>
        <p>Make sure the Strapi backend is running on localhost:1337.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="srh-page-title">Projects</h1>
          <p className="srh-page-subtitle">{items.length} project{items.length !== 1 ? 's' : ''}</p>
        </div>
        {isAmbassador && <CreateProjectForm />}
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><h2>No projects yet.</h2></div>
      ) : (
        <div className="content-list">
          {items.map((item) => (
            <div key={item.documentId} className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">{item.title}</span>
                <StatusBadge status={item.status} />
              </div>
              {item.description && (
                <p className="content-card-body">
                  {item.description.length > 200 ? item.description.slice(0, 200) + '…' : item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
