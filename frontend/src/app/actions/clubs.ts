'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getToken } from '@/lib/auth';
import { strapiPost } from '@/lib/strapi';

export async function voteAction(
  documentId: string,
): Promise<{ error: string } | { voteCount: number }> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in to vote.' };

  try {
    const res = await strapiPost<{ voteCount: number }>(
      `/clubs/${documentId}/vote`,
      {},
      token,
    );
    revalidatePath(`/clubs/${documentId}`);
    return { voteCount: res.voteCount };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Vote failed.';
    return { error: msg };
  }
}

export type ProposeState = { error: string } | null;

export async function proposeAction(
  _prev: ProposeState,
  formData: FormData,
): Promise<ProposeState> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  if (!name || !description) return { error: 'Name and description are required.' };

  let documentId: string;
  try {
    const res = await strapiPost<{ data: { documentId: string } }>(
      '/clubs',
      { data: { name, description } },
      token,
    );
    documentId = res.data.documentId;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not create club.';
    return { error: msg };
  }

  revalidatePath('/clubs');
  redirect(`/clubs/${documentId}`);
}

export async function seedVotesAction(
  documentId: string,
): Promise<{ error: string } | { voteCount: number }> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  try {
    const res = await strapiPost<{ voteCount: number }>(
      `/dev/clubs/${documentId}/seed-votes`,
      {},
      token,
    );
    revalidatePath(`/clubs/${documentId}`);
    revalidatePath('/clubs');
    return { voteCount: res.voteCount };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Seeding votes failed.';
    return { error: msg };
  }
}

export async function approveAction(
  documentId: string,
): Promise<{ error: string } | { success: true }> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  try {
    await strapiPost(`/clubs/${documentId}/approve`, {}, token);
    revalidatePath(`/clubs/${documentId}`);
    revalidatePath('/clubs');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Approval failed.';
    return { error: msg };
  }
}
