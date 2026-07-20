'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/actions/auth';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={action} className="propose-form">
      {state?.error && (
        <div className="form-error">{state.error}</div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-input"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-input"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <button type="submit" className="srh-btn" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
