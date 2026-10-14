'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getToken } from '@/lib/auth';
import { strapiPost, strapiUploadFile } from '@/lib/strapi';

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
  const email = (formData.get('email') as string)?.trim();
  const maxMembers = Number(formData.get('maxMembers'));
  if (!name || !description) return { error: 'Name and description are required.' };
  if (!email) return { error: 'Contact email is required.' };
  if (!maxMembers || !Number.isInteger(maxMembers) || maxMembers < 1) {
    return { error: 'Maximum members must be a positive whole number.' };
  }

  const coverFile = formData.get('cover');
  let coverId: number | undefined;
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverId = (await strapiUploadFile(coverFile, token)).id;
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Cover image upload failed.' };
    }
  }

  let documentId: string;
  try {
    const res = await strapiPost<{ data: { documentId: string } }>(
      '/clubs',
      { data: { name, description, email, maxMembers, ...(coverId ? { cover: coverId } : {}) } },
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

export async function rejectAction(
  documentId: string,
  reason: string,
): Promise<{ error: string } | { success: true }> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  try {
    await strapiPost(`/clubs/${documentId}/reject`, { reason }, token);
    revalidatePath(`/clubs/${documentId}`);
    revalidatePath('/clubs');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Rejection failed.';
    return { error: msg };
  }
}

export async function scheduleEventAction(
  documentId: string,
  club_event: string,
): Promise<{ error: string } | { success: true }> {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  try {
    await strapiPost(`/clubs/${documentId}/schedule-event`, { club_event }, token);
    revalidatePath(`/clubs/${documentId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not save the event.';
    return { error: msg };
  }
}
