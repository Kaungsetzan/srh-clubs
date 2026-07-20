import { cookies } from 'next/headers';
import { COOKIE_NAME } from './constants';

export { COOKIE_NAME };

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

export type CurrentUser = {
  id: number;
  documentId: string;
  username: string;
  email: string;
  role: { name: string } | null;
};

export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    // Fetch user profile and role in parallel.
    // /api/users/me?populate=role strips the role for non-admin callers in Strapi 5,
    // so we use a custom /api/users/me/role endpoint for reliable role data.
    const [userRes, roleRes] = await Promise.all([
      fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }),
      fetch(`${STRAPI_URL}/api/users/me/role`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }),
    ]);

    if (!userRes.ok) return null;

    const user = await userRes.json();
    const roleData = roleRes.ok ? await roleRes.json() : null;

    return {
      id: user.id,
      documentId: user.documentId ?? String(user.id),
      username: user.username,
      email: user.email,
      role: roleData?.role ?? null,
    };
  } catch {
    return null;
  }
}
