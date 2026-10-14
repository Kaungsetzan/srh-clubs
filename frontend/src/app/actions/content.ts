'use server';
import { revalidatePath } from 'next/cache';
import { getToken } from '@/lib/auth';
import { strapiPost, strapiUploadFile } from '@/lib/strapi';

async function uploadCover(formData: FormData, token: string): Promise<number | undefined> {
  const coverFile = formData.get('cover');
  if (!(coverFile instanceof File) || coverFile.size === 0) return undefined;
  return (await strapiUploadFile(coverFile, token)).id;
}

export async function createNewsAction(_prev: { error?: string } | null, formData: FormData) {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  const title = formData.get('title')?.toString().trim();
  const content = formData.get('content')?.toString().trim();
  if (!title) return { error: 'Title is required.' };

  try {
    const cover = await uploadCover(formData, token);
    await strapiPost('/news', { data: { title, content, ...(cover ? { cover } : {}) } }, token);
    revalidatePath('/news');
    return { error: undefined };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create news.' };
  }
}

export async function createEventAction(_prev: { error?: string } | null, formData: FormData) {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const date = formData.get('date')?.toString().trim();
  const location = formData.get('location')?.toString().trim();

  if (!title) return { error: 'Title is required.' };
  if (!date) return { error: 'Date is required.' };

  try {
    const cover = await uploadCover(formData, token);
    await strapiPost('/events', { data: { title, description, date, location, ...(cover ? { cover } : {}) } }, token);
    revalidatePath('/events');
    return { error: undefined };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create event.' };
  }
}

export async function createProjectAction(_prev: { error?: string } | null, formData: FormData) {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const status = formData.get('status')?.toString() ?? 'ongoing';

  if (!title) return { error: 'Title is required.' };

  try {
    const cover = await uploadCover(formData, token);
    await strapiPost('/projects', { data: { title, description, status, ...(cover ? { cover } : {}) } }, token);
    revalidatePath('/projects');
    return { error: undefined };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create project.' };
  }
}
