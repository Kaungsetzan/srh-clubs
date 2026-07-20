const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

// Strapi 5 flat response — attributes at top level, field names match schema exactly.
// The club schema uses `club_status` (not `status`) and `founder` (not `proposer`).
// The vote schema uses `voter` for the user relation.
export type StrapiUser = {
  id: number;
  documentId: string;
  username: string;
  email: string;
  profile?: StrapiMedia;
};

export type StrapiVote = {
  id: number;
  documentId: string;
  voter?: StrapiUser;
};

export type ClubStatus = 'pending' | 'eligible' | 'approved' | 'rejected';

export type StrapiMedia = {
  id: number;
  documentId: string;
  name: string;
  url: string;
  mime: string;
  width?: number;
  height?: number;
  alternativeText?: string | null;
  formats?: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  } | null;
};

export type StrapiClub = {
  id: number;
  documentId: string;
  name: string;
  description: string;
  club_status: ClubStatus;   // field name in Strapi schema is club_status
  founder?: StrapiUser;      // relation name in Strapi schema is founder
  votes?: StrapiVote[];
  approvedBy?: StrapiUser;
  cover?: StrapiMedia;
  club_event?: string | null;  // plain text field in the Strapi schema, not a relation
  createdAt: string;
  updatedAt: string;
};

export function getStrapiMediaUrl(media?: StrapiMedia | null): string | undefined {
  if (!media?.url) return undefined;
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

export type StrapiListResponse<T> = {
  data: T[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
};

export type StrapiSingleResponse<T> = {
  data: T;
};

export async function strapiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Strapi GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function strapiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `Strapi POST ${path} failed: ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export async function getClubs(): Promise<StrapiClub[]> {
  const res = await strapiGet<StrapiListResponse<StrapiClub>>('/clubs?populate=*');
  return res.data;
}

export async function getClub(documentId: string): Promise<StrapiClub> {
  // populate=* is shallow (1 level) and won't reach votes[].voter or
  // founder.profile, so the relations needed by the detail page (Members
  // list, founder's profile photo) are populated explicitly instead.
  const populate =
    'populate[founder][populate][profile]=true&populate[approvedBy]=true&populate[cover]=true&populate[votes][populate][voter]=true';
  const res = await strapiGet<StrapiSingleResponse<StrapiClub>>(`/clubs/${documentId}?${populate}`);
  return res.data;
}

export type StrapiNews = {
  id: number;
  documentId: string;
  title: string;
  content?: string;
  publishedDate?: string;
  author?: StrapiUser;
  createdAt: string;
};

export type StrapiEvent = {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdAt: string;
};

export type ProjectStatus = 'ongoing' | 'completed';

export type StrapiProject = {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
};

export type StrapiAmbassador = {
  id: number;
  documentId: string;
  username: string;
};

export async function getNews(): Promise<StrapiNews[]> {
  const res = await strapiGet<StrapiListResponse<StrapiNews>>('/news?populate=*');
  return res.data;
}

export async function getEvents(): Promise<StrapiEvent[]> {
  const res = await strapiGet<StrapiListResponse<StrapiEvent>>('/events?populate=*');
  return res.data;
}

export async function getProjects(): Promise<StrapiProject[]> {
  const res = await strapiGet<StrapiListResponse<StrapiProject>>('/projects?populate=*');
  return res.data;
}

export async function getAmbassadors(): Promise<StrapiAmbassador[]> {
  return strapiGet<StrapiAmbassador[]>('/ambassadors');
}

// Authenticated wrappers — pass token from getToken() in lib/auth.ts
export async function strapiGetAuth<T>(path: string, token: string): Promise<T> {
  return strapiGet<T>(path, token);
}

export async function strapiPostAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  return strapiPost<T>(path, body, token);
}
