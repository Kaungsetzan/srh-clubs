'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/app/actions/auth';

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="srh-nav-logout"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {pending ? 'Signing out…' : 'Log out'}
    </button>
  );
}
