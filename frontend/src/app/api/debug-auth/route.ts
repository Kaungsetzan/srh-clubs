import { getCurrentUser, getToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const token = await getToken();
  const user = await getCurrentUser();
  return NextResponse.json({ hasToken: !!token, tokenPrefix: token?.slice(0,20), user });
}
