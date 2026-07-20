'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME } from '@/lib/auth';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Email and password are required.' };
  }

  let jwt: string;
  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        body?.error?.message ?? 'Invalid email or password.';
      return { error: message };
    }

    const data = await res.json();
    jwt = data.jwt;
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, COOKIE_OPTIONS);

  redirect('/clubs');
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/clubs');
}
