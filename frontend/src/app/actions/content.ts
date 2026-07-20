'use server';
import { revalidatePath } from 'next/cache';
import { getToken } from '@/lib/auth';
import { strapiPost } from '@/lib/strapi';

export async function createNewsAction(_prev: { error?: string } | null, formData: FormData) {
  const token = await getToken();
  if (!token) return { error: 'You must be logged in.' };

  const title = formData.get('title')?.toString().trim();
  const content = formData.get('content')?.toString().trim();
  if (!title) return { error: 'Title is required.' };

  try {
    await strapiPost('/news', { data: { title, content } }, token);
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
    await strapiPost('/events', { data: { title, description, date, location } }, token);
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
    await strapiPost('/projects', { data: { title, description, status } }, token);
    revalidatePath('/projects');
    return { error: undefined };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to create project.' };
  }
}
