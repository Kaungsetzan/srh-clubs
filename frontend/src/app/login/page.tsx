import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  // Already logged in — send to clubs
  const user = await getCurrentUser();
  if (user) redirect('/clubs');

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h1 className="srh-page-title" style={{ marginBottom: '0.4rem' }}>
        Sign in
      </h1>
      <p className="srh-page-subtitle">
        Use your SRH student account credentials.
      </p>
      <LoginForm />
    </div>
  );
}
