'use server';

import { signIn, signOut } from '@/lib/auth';

// Server actions usable from client components (top-bar user menu / sign-in button).
export async function signInWithGoogle() {
  await signIn('google');
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
